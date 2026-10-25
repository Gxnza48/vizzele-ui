/** Every Vizzele effect returns this: the same contract for JS, `data-vz-*` and React. */
export interface EffectInstance<O = object> {
  /** Changes options without recreating the effect. */
  update(options: Partial<O>): void;
  /** Removes listeners and restores the element. */
  destroy(): void;
}

export type EffectFactory<O = object> = (el: HTMLElement, options?: O) => EffectInstance<O>;

export const inertInstance = <O>(): EffectInstance<O> => ({ update() {}, destroy() {} });
