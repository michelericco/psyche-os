// Core types and schemas
export {
  EntityKind,
  EntitySchema,
  ExperienceKind,
  ExperienceSchema,
  PatternKind,
  PatternSchema,
  ArchetypeKind,
  ArchetypeSchema,
  DimensionKind,
  DimensionSchema,
  PotentialState,
  PotentialSchema,
  CycleKind,
  CycleSchema,
  InsightKind,
  InsightSchema,
  AccessLevelId,
  AccessLevelSchema,
  RelationKind,
  RelationSchema,
} from "./types.js";

export type {
  Entity,
  Experience,
  Pattern,
  Archetype,
  Dimension,
  Potential,
  Cycle,
  Insight,
  AccessLevel,
  Relation,
} from "./types.js";

// Dimensions
export {
  DIMENSIONS,
  getDimension,
  getMetrics,
} from "./dimensions.js";

export type { DimensionSpec } from "./dimensions.js";

// Access levels
export {
  ACCESS_LEVELS,
  getAccessLevel,
  canAccess,
} from "./levels.js";

export type { AccessLevelSpec } from "./levels.js";

// Temporal stratification
export {
  TemporalGranularity,
  TemporalTrend,
  TemporalWindowSchema,
  TemporalPatternSchema,
  TemporalLayerSchema,
  stratifyTemporally,
  stratifyMultiGranularity,
} from "../pipeline/temporal.js";

export type {
  TemporalWindow,
  TemporalPattern,
  TemporalLayer,
} from "../pipeline/temporal.js";
