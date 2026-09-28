// @expect-dep none
import { entity } from '../domain/entity.js';
import { betaApi } from '../../beta/index.js';
export const useCase = (): readonly string[] => [entity, betaApi];
