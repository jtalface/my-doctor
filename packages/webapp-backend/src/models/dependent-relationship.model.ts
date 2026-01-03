import mongoose, { Document, Schema } from 'mongoose';

/**
 * Relationship types between manager and dependent
 */
export type RelationshipType = 'parent' | 'guardian' | 'spouse' | 'sibling' | 'grandparent' | 'other';

export interface IDependentRelationship extends Document {
  managerId: mongoose.Types.ObjectId;    // The account holder who manages this dependent
  dependentId: mongoose.Types.ObjectId;  // The dependent user
  relationship: RelationshipType;        // How they're related
  isPrimary: boolean;                    // Primary manager (creator) of the dependent
  addedAt: Date;                         // When this relationship was created
  createdAt: Date;
  updatedAt: Date;
}

const DependentRelationshipSchema = new Schema<IDependentRelationship>(
  {
    managerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    dependentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    relationship: { 
      type: String, 
      enum: ['parent', 'guardian', 'spouse', 'sibling', 'grandparent', 'other'],
      required: true,
    },
    isPrimary: { 
      type: Boolean, 
      default: false,
    },
    addedAt: { 
      type: Date, 
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a manager can only have one relationship to a dependent
DependentRelationshipSchema.index({ managerId: 1, dependentId: 1 }, { unique: true });

// Index for finding all dependents of a manager
DependentRelationshipSchema.index({ managerId: 1 });

// Index for finding all managers of a dependent
DependentRelationshipSchema.index({ dependentId: 1 });

export const DependentRelationship = mongoose.model<IDependentRelationship>(
  'DependentRelationship', 
  DependentRelationshipSchema
);

