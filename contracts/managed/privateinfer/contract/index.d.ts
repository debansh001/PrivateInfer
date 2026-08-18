import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum QueryStatus { UNKNOWN = 0,
                          PROCESSING = 1,
                          RESULT_READY = 2,
                          PAID = 3,
                          CANCELLED = 4
}

export type Query = { creator: Uint8Array;
                      provider: Uint8Array;
                      commitmentHash: Uint8Array;
                      resultHash: Uint8Array;
                      status: QueryStatus
                    };

export type Witnesses<PS> = {
  callerAddress(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array,
              commitment_0: Uint8Array,
              providerAddr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               queryId_0: Uint8Array,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>,
                 queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array,
              commitment_0: Uint8Array,
              providerAddr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               queryId_0: Uint8Array,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>,
                 queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  createQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array,
              commitment_0: Uint8Array,
              providerAddr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResult(context: __compactRuntime.CircuitContext<PS>,
               queryId_0: Uint8Array,
               resultProofHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  releasePayment(context: __compactRuntime.CircuitContext<PS>,
                 queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelQuery(context: __compactRuntime.CircuitContext<PS>,
              queryId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  queries: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Query;
    [Symbol.iterator](): Iterator<[Uint8Array, Query]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
