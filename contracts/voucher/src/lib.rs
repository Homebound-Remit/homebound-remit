//! Homebound — Voucher Contract (reused from PayrollRails pattern)
//!
//! create(claimant, amount, expiry) → voucher_id
//! claim(voucher_id)               → transfers USDC to claimant
//! reclaim(voucher_id)             → sender reclaims after expiry
//!
//! In the MVP this logic lives in Stellar Claimable Balances (native feature).
//! This contract is the on-chain upgrade path when custom logic is needed.

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, BytesN, Env, Symbol, Vec,
    token,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum VoucherStatus {
    Unclaimed,
    Claimed,
    Reclaimed,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Voucher {
    pub id:        BytesN<32>,
    pub sender:    Address,
    pub claimant:  Address,
    pub amount:    i128,
    pub token:     Address,
    pub expiry:    u64,    // ledger timestamp
    pub status:    VoucherStatus,
}

#[contracttype]
pub enum DataKey {
    Voucher(BytesN<32>),
    Counter,
}

#[contract]
pub struct VoucherContract;

#[contractimpl]
impl VoucherContract {
    /// Create a new voucher. Tokens are held in the contract.
    pub fn create(
        env:      Env,
        sender:   Address,
        claimant: Address,
        amount:   i128,
        token:    Address,
        expiry:   u64,
    ) -> BytesN<32> {
        sender.require_auth();

        // Increment counter for unique ID
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0u64);
        let new_counter = counter + 1;
        env.storage().instance().set(&DataKey::Counter, &new_counter);

        // Build ID from counter + sender
        let mut preimage = soroban_sdk::Bytes::new(&env);
        preimage.append(&sender.to_xdr(&env));
        preimage.extend_from_array(&new_counter.to_be_bytes());
        let id: BytesN<32> = env.crypto().sha256(&preimage);

        // Pull tokens from sender into contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let voucher = Voucher {
            id: id.clone(),
            sender,
            claimant,
            amount,
            token,
            expiry,
            status: VoucherStatus::Unclaimed,
        };

        env.storage().instance().set(&DataKey::Voucher(id.clone()), &voucher);

        env.events().publish(
            (Symbol::new(&env, "voucher_created"), id.clone()),
            amount,
        );

        id
    }

    /// Claimant claims their voucher before expiry
    pub fn claim(env: Env, voucher_id: BytesN<32>) {
        let mut voucher: Voucher = env
            .storage()
            .instance()
            .get(&DataKey::Voucher(voucher_id.clone()))
            .expect("voucher not found");

        voucher.claimant.require_auth();

        assert!(voucher.status == VoucherStatus::Unclaimed, "already used");
        assert!(env.ledger().timestamp() <= voucher.expiry, "expired");

        // Transfer from contract → claimant
        let token_client = token::Client::new(&env, &voucher.token);
        token_client.transfer(
            &env.current_contract_address(),
            &voucher.claimant,
            &voucher.amount,
        );

        voucher.status = VoucherStatus::Claimed;
        env.storage().instance().set(&DataKey::Voucher(voucher_id.clone()), &voucher);

        env.events().publish(
            (Symbol::new(&env, "voucher_claimed"), voucher_id),
            voucher.amount,
        );
    }

    /// Sender reclaims after expiry
    pub fn reclaim(env: Env, voucher_id: BytesN<32>) {
        let mut voucher: Voucher = env
            .storage()
            .instance()
            .get(&DataKey::Voucher(voucher_id.clone()))
            .expect("voucher not found");

        voucher.sender.require_auth();

        assert!(voucher.status == VoucherStatus::Unclaimed, "already used");
        assert!(env.ledger().timestamp() > voucher.expiry, "not yet expired");

        let token_client = token::Client::new(&env, &voucher.token);
        token_client.transfer(
            &env.current_contract_address(),
            &voucher.sender,
            &voucher.amount,
        );

        voucher.status = VoucherStatus::Reclaimed;
        env.storage().instance().set(&DataKey::Voucher(voucher_id.clone()), &voucher);

        env.events().publish(
            (Symbol::new(&env, "voucher_reclaimed"), voucher_id),
            voucher.amount,
        );
    }

    pub fn get_voucher(env: Env, voucher_id: BytesN<32>) -> Option<Voucher> {
        env.storage().instance().get(&DataKey::Voucher(voucher_id))
    }
}
