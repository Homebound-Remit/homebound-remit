//! Homebound — Biller Registry Soroban Contract
//!
//! register_biller(name, category, wallet_address) → biller_id
//! pay_bill(biller_id, reference, amount)           → emits ReceiptEvent
//!
//! The MVP uses a mock API with identical interface; replace the API route's
//! sendUSDC + recordPayment calls with soroban_client.invoke_contract(...)
//! pointing at this contract address for a 1:1 mainnet upgrade.

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contractevent, contracttype,
    Address, Bytes, BytesN, Env, Map, String, Symbol, Vec,
    token,
};

// ─── Data types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub struct Biller {
    pub id:             BytesN<32>,
    pub name:           String,
    pub category:       Symbol,      // "school" | "utility" | "rent" | "telecom"
    pub wallet_address: Address,
    pub currency:       Symbol,      // "KES" | "PHP" | "NGN" …
    pub active:         bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Receipt {
    pub biller_id:   BytesN<32>,
    pub reference:   String,
    pub amount:      i128,
    pub sender:      Address,
    pub timestamp:   u64,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    Biller(BytesN<32>),
    BillerList,
    Admin,
}

// ─── Events ──────────────────────────────────────────────────────────────────

/// Emitted by pay_bill — indexable by biller_id and reference off-chain
#[contractevent]
pub struct ReceiptEvent {
    pub biller_id:  BytesN<32>,
    pub reference:  String,
    pub amount:     i128,
    pub sender:     Address,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct BillerRegistry;

#[contractimpl]
impl BillerRegistry {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BillerList, &Vec::<BytesN<32>>::new(&env));
    }

    /// Register a new biller. Only callable by admin.
    /// Returns the generated biller_id (hash of name + wallet).
    pub fn register_biller(
        env:            Env,
        name:           String,
        category:       Symbol,
        wallet_address: Address,
        currency:       Symbol,
    ) -> BytesN<32> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Deterministic ID: hash(name ++ wallet_address)
        let mut preimage = Bytes::new(&env);
        preimage.append(&name.to_xdr(&env));
        preimage.append(&wallet_address.to_xdr(&env));
        let id: BytesN<32> = env.crypto().sha256(&preimage);

        let biller = Biller {
            id: id.clone(),
            name,
            category,
            wallet_address,
            currency,
            active: true,
        };

        env.storage().instance().set(&DataKey::Biller(id.clone()), &biller);

        let mut list: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::BillerList)
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(id.clone());
        env.storage().instance().set(&DataKey::BillerList, &list);

        id
    }

    /// Pay a registered biller directly in USDC.
    /// Caller must have approved the token transfer.
    /// Emits a ReceiptEvent for indexers and the biller dashboard.
    pub fn pay_bill(
        env:       Env,
        sender:    Address,
        biller_id: BytesN<32>,
        reference: String,
        amount:    i128,
        token:     Address,
    ) -> Receipt {
        sender.require_auth();

        let biller: Biller = env
            .storage()
            .instance()
            .get(&DataKey::Biller(biller_id.clone()))
            .expect("biller not found");

        if !biller.active {
            panic!("biller is inactive");
        }

        // Transfer USDC from sender → biller wallet
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &biller.wallet_address, &amount);

        let receipt = Receipt {
            biller_id:  biller_id.clone(),
            reference:  reference.clone(),
            amount,
            sender:     sender.clone(),
            timestamp:  env.ledger().timestamp(),
        };

        // Emit receipt event — indexable off-chain via Horizon
        env.events().publish(
            (Symbol::new(&env, "pay_bill"), biller_id.clone()),
            ReceiptEvent {
                biller_id,
                reference,
                amount,
                sender,
            },
        );

        receipt
    }

    /// Get biller by ID
    pub fn get_biller(env: Env, biller_id: BytesN<32>) -> Option<Biller> {
        env.storage().instance().get(&DataKey::Biller(biller_id))
    }

    /// List all biller IDs
    pub fn list_billers(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::BillerList)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Deactivate a biller (admin only)
    pub fn deactivate_biller(env: Env, biller_id: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut biller: Biller = env
            .storage()
            .instance()
            .get(&DataKey::Biller(biller_id.clone()))
            .expect("biller not found");
        biller.active = false;
        env.storage().instance().set(&DataKey::Biller(biller_id), &biller);
    }
}
