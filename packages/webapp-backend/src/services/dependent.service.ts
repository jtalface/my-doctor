import { User, IUser } from '../models/user.model.js';
import { PatientProfile, IPatientProfile } from '../models/patient-profile.model.js';
import { 
  DependentRelationship, 
  IDependentRelationship, 
  RelationshipType 
} from '../models/dependent-relationship.model.js';
import { Session } from '../models/session.model.js';

/**
 * Custom error class for dependent-related errors
 */
export class DependentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DependentError';
  }
}

export const DependentErrorCode = {
  DEPENDENT_NOT_FOUND: 'DEPENDENT_NOT_FOUND',
  MANAGER_NOT_FOUND: 'MANAGER_NOT_FOUND',
  AGE_REQUIREMENT_NOT_MET: 'AGE_REQUIREMENT_NOT_MET',
  ALREADY_MANAGING: 'ALREADY_MANAGING',
  NOT_A_MANAGER: 'NOT_A_MANAGER',
  CANNOT_REMOVE_PRIMARY: 'CANNOT_REMOVE_PRIMARY',
  INVALID_RELATIONSHIP: 'INVALID_RELATIONSHIP',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * Input for creating a new dependent
 */
export interface CreateDependentInput {
  name: string;
  dateOfBirth: Date;
  relationship: RelationshipType;
  language?: string;
}

/**
 * Input for adding a manager to an existing dependent
 */
export interface AddManagerInput {
  dependentId: string;
  managerId: string;
  relationship: RelationshipType;
}

/**
 * Input for adding a manager by email
 */
export interface AddManagerByEmailInput {
  dependentId: string;
  email: string;
  relationship: RelationshipType;
}

/**
 * Input for updating a dependent
 */
export interface UpdateDependentInput {
  name?: string;
  dateOfBirth?: Date;
  language?: string;
}

/**
 * Dependent with relationship info
 */
export interface DependentWithRelationship {
  id: string;
  name: string;
  dateOfBirth: Date;
  age: number;
  preferences: {
    language: string;
    notifications: boolean;
    dataSharing: boolean;
  };
  relationship: RelationshipType;
  isPrimary: boolean;
  addedAt: Date;
  hasProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Manager info for a dependent
 */
export interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  relationship: RelationshipType;
  isPrimary: boolean;
  addedAt: Date;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate that person is under 18
 */
function validateAgeRequirement(dateOfBirth: Date): void {
  const age = calculateAge(dateOfBirth);
  
  if (age >= 18) {
    throw new DependentError(
      DependentErrorCode.AGE_REQUIREMENT_NOT_MET,
      `Dependents must be under 18 years old at the time of adding. This person is ${age} years old.`,
      400
    );
  }
}

class DependentService {
  /**
   * Create a new dependent and link to manager
   */
  async createDependent(
    managerId: string,
    input: CreateDependentInput
  ): Promise<DependentWithRelationship> {
    // Validate manager exists and is not a dependent
    const manager = await User.findById(managerId);
    if (!manager) {
      throw new DependentError(
        DependentErrorCode.MANAGER_NOT_FOUND,
        'Manager account not found',
        404
      );
    }
    
    if (manager.isDependent) {
      throw new DependentError(
        DependentErrorCode.VALIDATION_ERROR,
        'A dependent cannot add other dependents',
        400
      );
    }

    // Validate age requirement (must be under 18)
    validateAgeRequirement(input.dateOfBirth);

    // Create the dependent user (no email, no password)
    const dependent = await User.create({
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      isDependent: true,
      isGuest: false,
      preferences: {
        notifications: true,
        dataSharing: false,
        language: input.language || manager.preferences.language || 'en',
      },
      emailVerified: false,
      failedLoginAttempts: 0,
    });

    // Create the relationship (manager is primary since they created the dependent)
    const relationship = await DependentRelationship.create({
      managerId: manager._id,
      dependentId: dependent._id,
      relationship: input.relationship,
      isPrimary: true,
      addedAt: new Date(),
    });

    return this.formatDependentWithRelationship(dependent, relationship);
  }

  /**
   * Add a manager by email lookup
   */
  async addManagerByEmail(
    requesterId: string,
    input: AddManagerByEmailInput
  ): Promise<{ success: boolean; message: string }> {
    // Find user by email
    const userToAdd = await User.findOne({ email: input.email.toLowerCase() });
    
    if (!userToAdd) {
      throw new DependentError(
        DependentErrorCode.MANAGER_NOT_FOUND,
        'No account found with this email address',
        404
      );
    }

    // Delegate to addManager
    return this.addManager(requesterId, {
      dependentId: input.dependentId,
      managerId: userToAdd._id.toString(),
      relationship: input.relationship,
    });
  }

  /**
   * Add an additional manager to an existing dependent
   */
  async addManager(
    requesterId: string,
    input: AddManagerInput
  ): Promise<{ success: boolean; message: string }> {
    // Verify requester is already a manager of this dependent
    const requesterRelation = await DependentRelationship.findOne({
      managerId: requesterId,
      dependentId: input.dependentId,
    });

    if (!requesterRelation) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have permission to add managers to this dependent',
        403
      );
    }

    // Verify the new manager exists and is not a dependent
    const newManager = await User.findById(input.managerId);
    if (!newManager) {
      throw new DependentError(
        DependentErrorCode.MANAGER_NOT_FOUND,
        'The specified user to add as manager was not found',
        404
      );
    }

    if (newManager.isDependent) {
      throw new DependentError(
        DependentErrorCode.VALIDATION_ERROR,
        'A dependent cannot be added as a manager',
        400
      );
    }

    // Check if already managing
    const existingRelation = await DependentRelationship.findOne({
      managerId: input.managerId,
      dependentId: input.dependentId,
    });

    if (existingRelation) {
      throw new DependentError(
        DependentErrorCode.ALREADY_MANAGING,
        'This user is already managing this dependent',
        400
      );
    }

    // Create the new relationship (not primary since dependent already exists)
    await DependentRelationship.create({
      managerId: input.managerId,
      dependentId: input.dependentId,
      relationship: input.relationship,
      isPrimary: false,
      addedAt: new Date(),
    });

    return { success: true, message: 'Manager added successfully' };
  }

  /**
   * Get all dependents for a manager
   */
  async getDependents(managerId: string): Promise<DependentWithRelationship[]> {
    const relationships = await DependentRelationship.find({ managerId })
      .populate('dependentId')
      .sort({ addedAt: -1 });

    const dependents: DependentWithRelationship[] = [];

    for (const rel of relationships) {
      const dependent = rel.dependentId as unknown as IUser;
      if (dependent && dependent.isDependent) {
        dependents.push(this.formatDependentWithRelationship(dependent, rel));
      }
    }

    return dependents;
  }

  /**
   * Get a specific dependent by ID (with authorization check)
   */
  async getDependent(
    managerId: string,
    dependentId: string
  ): Promise<DependentWithRelationship> {
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    }).populate('dependentId');

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    const dependent = relationship.dependentId as unknown as IUser;
    if (!dependent) {
      throw new DependentError(
        DependentErrorCode.DEPENDENT_NOT_FOUND,
        'Dependent not found',
        404
      );
    }

    return this.formatDependentWithRelationship(dependent, relationship);
  }

  /**
   * Get all managers of a dependent
   */
  async getManagers(
    requesterId: string,
    dependentId: string
  ): Promise<ManagerInfo[]> {
    // Verify requester has access
    const requesterRelation = await DependentRelationship.findOne({
      managerId: requesterId,
      dependentId,
    });

    if (!requesterRelation) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    const relationships = await DependentRelationship.find({ dependentId })
      .populate('managerId')
      .sort({ isPrimary: -1, addedAt: 1 });

    return relationships.map(rel => {
      const manager = rel.managerId as unknown as IUser;
      return {
        id: manager._id.toString(),
        name: manager.name,
        email: manager.email || '',
        relationship: rel.relationship,
        isPrimary: rel.isPrimary,
        addedAt: rel.addedAt,
      };
    });
  }

  /**
   * Update a dependent's information
   */
  async updateDependent(
    managerId: string,
    dependentId: string,
    updates: UpdateDependentInput
  ): Promise<DependentWithRelationship> {
    // Verify manager has access
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    // If updating date of birth, we don't re-validate age
    // (dependents can stay after turning 18)
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.dateOfBirth) updateData.dateOfBirth = updates.dateOfBirth;
    if (updates.language) updateData['preferences.language'] = updates.language;

    const dependent = await User.findByIdAndUpdate(
      dependentId,
      { $set: updateData },
      { new: true }
    );

    if (!dependent) {
      throw new DependentError(
        DependentErrorCode.DEPENDENT_NOT_FOUND,
        'Dependent not found',
        404
      );
    }

    return this.formatDependentWithRelationship(dependent, relationship);
  }

  /**
   * Update the relationship type
   */
  async updateRelationship(
    managerId: string,
    dependentId: string,
    newRelationship: RelationshipType
  ): Promise<DependentWithRelationship> {
    const relationship = await DependentRelationship.findOneAndUpdate(
      { managerId, dependentId },
      { $set: { relationship: newRelationship } },
      { new: true }
    ).populate('dependentId');

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    return this.formatDependentWithRelationship(
      relationship.dependentId as unknown as IUser,
      relationship
    );
  }

  /**
   * Remove a manager from a dependent
   */
  async removeManager(
    requesterId: string,
    dependentId: string,
    managerToRemoveId: string
  ): Promise<{ success: boolean; message: string; dependentDeleted?: boolean }> {
    // Verify requester has access
    const requesterRelation = await DependentRelationship.findOne({
      managerId: requesterId,
      dependentId,
    });

    if (!requesterRelation) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have permission to manage this dependent',
        403
      );
    }

    // Get the relationship to remove
    const relationToRemove = await DependentRelationship.findOne({
      managerId: managerToRemoveId,
      dependentId,
    });

    if (!relationToRemove) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'The specified user is not managing this dependent',
        400
      );
    }

    // Count total managers
    const managerCount = await DependentRelationship.countDocuments({ dependentId });

    // If this is the last manager, delete the dependent entirely
    if (managerCount === 1) {
      await this.deleteDependent(requesterId, dependentId);
      return { 
        success: true, 
        message: 'Dependent deleted as this was the last manager',
        dependentDeleted: true,
      };
    }

    // If removing primary manager, transfer primary status
    if (relationToRemove.isPrimary) {
      const nextManager = await DependentRelationship.findOne({
        dependentId,
        managerId: { $ne: managerToRemoveId },
      }).sort({ addedAt: 1 });

      if (nextManager) {
        nextManager.isPrimary = true;
        await nextManager.save();
      }
    }

    // Remove the relationship
    await DependentRelationship.deleteOne({
      managerId: managerToRemoveId,
      dependentId,
    });

    return { success: true, message: 'Manager removed successfully' };
  }

  /**
   * Delete a dependent entirely (and all their data)
   */
  async deleteDependent(
    managerId: string,
    dependentId: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify manager has access
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have permission to delete this dependent',
        403
      );
    }

    // Delete in order:
    // 1. Sessions
    await Session.deleteMany({ userId: dependentId });
    
    // 2. Patient Profile
    await PatientProfile.deleteOne({ userId: dependentId });
    
    // 3. All relationships
    await DependentRelationship.deleteMany({ dependentId });
    
    // 4. The dependent user
    await User.deleteOne({ _id: dependentId, isDependent: true });

    return { success: true, message: 'Dependent and all associated data deleted successfully' };
  }

  /**
   * Get dependent's profile
   */
  async getDependentProfile(
    managerId: string,
    dependentId: string
  ): Promise<IPatientProfile | null> {
    // Verify manager has access
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    return PatientProfile.findOne({ userId: dependentId });
  }

  /**
   * Update or create dependent's profile
   */
  async updateDependentProfile(
    managerId: string,
    dependentId: string,
    profileData: {
      demographics?: Partial<IPatientProfile['demographics']>;
      medicalHistory?: Partial<IPatientProfile['medicalHistory']>;
      lifestyle?: Partial<IPatientProfile['lifestyle']>;
    }
  ): Promise<IPatientProfile> {
    // Verify manager has access
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    // Find or create profile
    let profile = await PatientProfile.findOne({ userId: dependentId });

    if (!profile) {
      profile = await PatientProfile.create({
        userId: dependentId,
        demographics: profileData.demographics || {},
        medicalHistory: profileData.medicalHistory || {
          chronicConditions: [],
          allergies: [],
          medications: [],
          surgeries: [],
          familyHistory: [],
        },
        lifestyle: profileData.lifestyle || {},
        lastUpdated: new Date(),
      });
    } else {
      // Update existing profile
      if (profileData.demographics) {
        profile.demographics = { ...profile.demographics, ...profileData.demographics };
      }
      if (profileData.medicalHistory) {
        profile.medicalHistory = { ...profile.medicalHistory, ...profileData.medicalHistory };
      }
      if (profileData.lifestyle) {
        profile.lifestyle = { ...profile.lifestyle, ...profileData.lifestyle };
      }
      profile.lastUpdated = new Date();
      await profile.save();
    }

    return profile;
  }

  /**
   * Get sessions for a dependent
   */
  async getDependentSessions(
    managerId: string,
    dependentId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<any[]> {
    // Verify manager has access
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });

    if (!relationship) {
      throw new DependentError(
        DependentErrorCode.NOT_A_MANAGER,
        'You do not have access to this dependent',
        403
      );
    }

    const { limit = 50, skip = 0 } = options;

    return Session.find({ userId: dependentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Check if a user is a manager of a dependent
   */
  async isManager(managerId: string, dependentId: string): Promise<boolean> {
    const relationship = await DependentRelationship.findOne({
      managerId,
      dependentId,
    });
    return !!relationship;
  }

  /**
   * Format dependent with relationship info
   */
  private formatDependentWithRelationship(
    dependent: IUser,
    relationship: IDependentRelationship
  ): DependentWithRelationship {
    const dob = dependent.dateOfBirth || new Date();
    
    return {
      id: dependent._id.toString(),
      name: dependent.name,
      dateOfBirth: dob,
      age: calculateAge(dob),
      preferences: {
        language: dependent.preferences.language,
        notifications: dependent.preferences.notifications,
        dataSharing: dependent.preferences.dataSharing,
      },
      relationship: relationship.relationship,
      isPrimary: relationship.isPrimary,
      addedAt: relationship.addedAt,
      hasProfile: false, // Will be updated when needed
      createdAt: dependent.createdAt,
      updatedAt: dependent.updatedAt,
    };
  }
}

export const dependentService = new DependentService();

