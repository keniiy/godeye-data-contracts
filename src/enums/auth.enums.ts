/**
 * Authentication-related enums
 */

export enum UserType {
  CUSTOMER = "customer", // Regular patients/users
  BUSINESS_USER = "business", // Anyone representing a business entity
  ADMIN = "admin", // System administrators
  AGENT = "agent", // Field agents/staff
}
