/**
 * Entity Test Data Factories
 * Provides consistent test data generation for domain entities
 */

import { IKongUserContext } from '../../types/auth.types';

export interface MockUserEntity {
  _id: string;
  id?: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'inactive' | 'deleted';
  userType?: 'business' | 'individual' | 'admin';
  verified?: boolean;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: MockProfileEntity;
  business?: MockBusinessEntity;
  posts?: MockPostEntity[];
}

export interface MockProfileEntity {
  _id: string;
  id?: string;
  bio: string;
  avatar?: string;
  userId: string;
  profileKind: 'doctor' | 'patient' | 'admin';
}

export interface MockBusinessEntity {
  _id: string;
  id?: string;
  name: string;
  type: string;
  ownerId: string;
  owner?: MockUserEntity;
  contact?: MockContactEntity;
}

export interface MockPostEntity {
  _id: string;
  id?: string;
  title: string;
  content: string;
  authorId: string;
  author?: MockUserEntity;
  comments?: MockCommentEntity[];
}

export interface MockCommentEntity {
  _id: string;
  id?: string;
  content: string;
  authorId: string;
  author?: MockUserEntity;
}

export interface MockContactEntity {
  _id: string;
  id?: string;
  email: string;
  phone: string;
}

export interface MockFileEntity {
  _id: string;
  id?: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: 'image' | 'document' | 'video' | 'audio';
  userId: string;
  user?: MockUserEntity;
  folderId?: string;
  folder?: MockFolderEntity;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockFolderEntity {
  _id: string;
  id?: string;
  name: string;
  userId: string;
  user?: MockUserEntity;
}

/**
 * Entity Factory - Creates consistent test entities with sensible defaults
 */
export class EntityFactory {
  private static idCounter = 1000;

  private static generateId(): string {
    return `test_${this.idCounter++}`;
  }

  static createUser(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    const id = this.generateId();
    const now = new Date();
    
    return {
      _id: id,
      id: id,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@example.com',
      status: 'active',
      userType: 'individual',
      verified: true,
      phone: '+1234567890',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static createBusinessUser(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    return this.createUser({
      name: 'Business User',
      firstName: 'Business',
      lastName: 'Owner',
      email: 'business@example.com',
      userType: 'business',
      ...overrides,
    });
  }

  static createAdminUser(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    return this.createUser({
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'Super',
      email: 'admin@example.com',
      userType: 'admin',
      ...overrides,
    });
  }

  static createProfile(userId?: string, overrides: Partial<MockProfileEntity> = {}): MockProfileEntity {
    const id = this.generateId();
    
    return {
      _id: id,
      id: id,
      bio: 'Test profile bio',
      userId: userId || this.generateId(),
      profileKind: 'patient',
      ...overrides,
    };
  }

  static createDoctorProfile(userId?: string, overrides: Partial<MockProfileEntity> = {}): MockProfileEntity {
    return this.createProfile(userId, {
      bio: 'Experienced doctor specializing in general medicine',
      profileKind: 'doctor',
      ...overrides,
    });
  }

  static createBusiness(ownerId?: string, overrides: Partial<MockBusinessEntity> = {}): MockBusinessEntity {
    const id = this.generateId();
    
    return {
      _id: id,
      id: id,
      name: 'Test Business Corp',
      type: 'healthcare',
      ownerId: ownerId || this.generateId(),
      ...overrides,
    };
  }

  static createPost(authorId?: string, overrides: Partial<MockPostEntity> = {}): MockPostEntity {
    const id = this.generateId();
    
    return {
      _id: id,
      id: id,
      title: 'Test Post Title',
      content: 'This is a test post content.',
      authorId: authorId || this.generateId(),
      ...overrides,
    };
  }

  static createComment(authorId?: string, overrides: Partial<MockCommentEntity> = {}): MockCommentEntity {
    const id = this.generateId();
    
    return {
      _id: id,
      id: id,
      content: 'This is a test comment.',
      authorId: authorId || this.generateId(),
      ...overrides,
    };
  }

  static createFile(userId?: string, overrides: Partial<MockFileEntity> = {}): MockFileEntity {
    const id = this.generateId();
    const now = new Date();
    
    return {
      _id: id,
      id: id,
      name: `test-file-${id}.jpg`,
      originalName: 'test-image.jpg',
      mimeType: 'image/jpeg',
      size: 1024000, // 1MB
      fileType: 'image',
      userId: userId || this.generateId(),
      tags: ['test', 'image'],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static createFolder(userId?: string, overrides: Partial<MockFolderEntity> = {}): MockFolderEntity {
    const id = this.generateId();
    
    return {
      _id: id,
      id: id,
      name: 'Test Folder',
      userId: userId || this.generateId(),
      ...overrides,
    };
  }

  /**
   * Creates entities with relationships pre-populated
   */
  static createUserWithRelations(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    const user = this.createUser(overrides);
    const profile = this.createProfile(user._id);
    const business = this.createBusiness(user._id);
    const posts = [
      this.createPost(user._id, { title: 'First Post' }),
      this.createPost(user._id, { title: 'Second Post' }),
    ];

    return {
      ...user,
      profile,
      business,
      posts,
    };
  }

  /**
   * Creates arrays of entities for list/pagination scenarios
   */
  static createUsers(count: number, overrides: Partial<MockUserEntity> = {}): MockUserEntity[] {
    return Array.from({ length: count }, (_, index) =>
      this.createUser({
        name: `Test User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        ...overrides,
      })
    );
  }

  static createFiles(count: number, userId?: string, overrides: Partial<MockFileEntity> = {}): MockFileEntity[] {
    return Array.from({ length: count }, (_, index) =>
      this.createFile(userId, {
        name: `test-file-${index + 1}.jpg`,
        originalName: `file-${index + 1}.jpg`,
        ...overrides,
      })
    );
  }

  /**
   * Creates entities for specific test scenarios
   */
  static createInactiveUser(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    return this.createUser({
      status: 'inactive',
      verified: false,
      ...overrides,
    });
  }

  static createDeletedUser(overrides: Partial<MockUserEntity> = {}): MockUserEntity {
    return this.createUser({
      status: 'deleted',
      ...overrides,
    });
  }

  static createLargeFile(userId?: string, overrides: Partial<MockFileEntity> = {}): MockFileEntity {
    return this.createFile(userId, {
      size: 50 * 1024 * 1024, // 50MB
      fileType: 'video',
      mimeType: 'video/mp4',
      name: 'large-video.mp4',
      originalName: 'large-video.mp4',
      ...overrides,
    });
  }

  /**
   * Reset the ID counter for consistent test runs
   */
  static resetIdCounter(): void {
    this.idCounter = 1000;
  }
}

/**
 * Builder Pattern for Complex Entity Creation
 */
export class UserBuilder {
  private user: Partial<MockUserEntity> = {};

  static create(): UserBuilder {
    return new UserBuilder();
  }

  withBasicInfo(name: string, email: string): UserBuilder {
    this.user.name = name;
    this.user.email = email;
    const nameParts = name.split(' ');
    this.user.firstName = nameParts[0] || name;
    this.user.lastName = nameParts.slice(1).join(' ') || 'User';
    return this;
  }

  withStatus(status: 'active' | 'inactive' | 'deleted'): UserBuilder {
    this.user.status = status;
    return this;
  }

  withType(userType: 'business' | 'individual' | 'admin'): UserBuilder {
    this.user.userType = userType;
    return this;
  }

  withVerification(verified: boolean): UserBuilder {
    this.user.verified = verified;
    return this;
  }

  withPhone(phone: string): UserBuilder {
    this.user.phone = phone;
    return this;
  }

  withProfile(profile: MockProfileEntity): UserBuilder {
    this.user.profile = profile;
    return this;
  }

  withBusiness(business: MockBusinessEntity): UserBuilder {
    this.user.business = business;
    return this;
  }

  withPosts(posts: MockPostEntity[]): UserBuilder {
    this.user.posts = posts;
    return this;
  }

  build(): MockUserEntity {
    return EntityFactory.createUser(this.user);
  }
}

/**
 * Scenario-based entity creation
 */
export class EntityScenarios {
  /**
   * Doctor with complete profile and business
   */
  static doctorWithClinic(): MockUserEntity {
    const doctor = EntityFactory.createUser({
      userType: 'business',
      name: 'Dr. John Smith',
      firstName: 'Dr. John',
      lastName: 'Smith',
      email: 'dr.smith@clinic.com',
    });

    const profile = EntityFactory.createDoctorProfile(doctor._id, {
      bio: 'Experienced cardiologist with 15 years of practice',
    });

    const clinic = EntityFactory.createBusiness(doctor._id, {
      name: 'Smith Cardiology Clinic',
      type: 'medical_practice',
    });

    return {
      ...doctor,
      profile,
      business: clinic,
    };
  }

  /**
   * Patient with medical files
   */
  static patientWithFiles(): MockUserEntity {
    const patient = EntityFactory.createUser({
      userType: 'individual',
      name: 'Jane Doe',
      email: 'jane.doe@email.com',
    });

    const profile = EntityFactory.createProfile(patient._id, {
      bio: 'Patient seeking healthcare services',
      profileKind: 'patient',
    });

    const medicalFiles = EntityFactory.createFiles(3, patient._id, {
      fileType: 'document',
      mimeType: 'application/pdf',
      tags: ['medical', 'records'],
    });

    return {
      ...patient,
      profile,
      files: medicalFiles,
    };
  }

  /**
   * Admin user with system access
   */
  static systemAdmin(): MockUserEntity {
    return EntityFactory.createAdminUser({
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@system.com',
      verified: true,
    });
  }
}