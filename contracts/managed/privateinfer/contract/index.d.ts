import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum QueryStatus { PROCESSING = 0, RESULT_READY = 1, PAID = 2 }

export type Witnesses<PS> = {
  callerAddress(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly commitmentHash: Uint8Array;
  readonly resultHash: Uint8Array;
  readonly status: QueryStatus;
  readonly providerAddr: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               commitment_0: Uint8Array,
               provider_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
