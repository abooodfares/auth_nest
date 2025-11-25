-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'BLOCKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('ADMIN', 'FAMILY_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('MANAGE_ROLES', 'EDIT_NODE', 'EDIT_RELATIONS', 'SEND_INVITE', 'VIEW_FAMILY_MEMBERS', 'GET_ALL_USERS_PG', 'GET_ALL_USERS_NEO4J', 'SEARCH_PG', 'SEARCH_NEO4J');

-- CreateTable
CREATE TABLE "users" (
    "internal_id" SERIAL NOT NULL,
    "nationalId" VARCHAR(255),
    "public_id" TEXT NOT NULL,
    "family_id" INTEGER,
    "phone" VARCHAR(20),
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "birth_of_date" VARCHAR(10) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(50) NOT NULL,
    "email_verified_at" TIMESTAMP,
    "phone_verified_at" TIMESTAMP,
    "isblocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP,
    "blocked_until" TIMESTAMP,
    "block_count" INTEGER NOT NULL DEFAULT 0,
    "Forever_block" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "internal_id" SERIAL NOT NULL,
    "rolekey" "RoleKey" NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "internal_id" SERIAL NOT NULL,
    "key" "PermissionKey" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "User_and_Roles" (
    "internal_id" SERIAL NOT NULL,
    "roleid_fk" INTEGER NOT NULL,
    "userid_fk" INTEGER NOT NULL,

    CONSTRAINT "User_and_Roles_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "Role_and_Permissions" (
    "internal_id" SERIAL NOT NULL,
    "roleid_fk" INTEGER NOT NULL,
    "permissionid_fk" INTEGER NOT NULL,

    CONSTRAINT "Role_and_Permissions_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "users_audit" (
    "internal_id" SERIAL NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_absher" BOOLEAN NOT NULL,
    "birth_of_date" DATE NOT NULL,
    "email_verified" BOOLEAN NOT NULL,
    "phone_verified" BOOLEAN NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "userid_fk" INTEGER NOT NULL,
    "change_at" TIMESTAMP NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "change_count" INTEGER NOT NULL,
    "period_end" VARCHAR(50) NOT NULL,
    "device_fingerprint" TEXT,

    CONSTRAINT "users_audit_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "User_and_Roles_audit" (
    "internal_id" SERIAL NOT NULL,
    "useradmin_id" INTEGER,
    "userid_change_fk" INTEGER NOT NULL,
    "roleid_fk" INTEGER NOT NULL,
    "change_at" TIMESTAMP NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "User_and_Roles_audit_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "User_device" (
    "internal_id" SERIAL NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "create_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_name" VARCHAR(100) NOT NULL,
    "isblocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP,
    "blocked_until" TIMESTAMP,
    "block_count" INTEGER NOT NULL DEFAULT 0,
    "forever_block" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_device_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "Otp_Tokens" (
    "internal_id" SERIAL NOT NULL,
    "email" VARCHAR(50),
    "phone" VARCHAR(20),
    "userid_fk" INTEGER,
    "devicefingerprint" INTEGER,
    "otp_code" VARCHAR(6) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "blocked_at" TIMESTAMP,
    "verified_at" TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_Tokens_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "RefreshTokens" (
    "internal_id" SERIAL NOT NULL,
    "device_fingerprint" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "User_Device_UserId" (
    "internal_id" SERIAL NOT NULL,
    "deviceid_fk" INTEGER NOT NULL,
    "userid_fk" INTEGER NOT NULL,

    CONSTRAINT "User_Device_UserId_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "family_trees" (
    "internal_id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "family_trees_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "family_tree_admins" (
    "internal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "family_tree_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_tree_admins_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "family_tree_access" (
    "internal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "family_tree_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "family_tree_access_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "UserInvites" (
    "internal_id" UUID NOT NULL,
    "family_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "email" VARCHAR(50),
    "phone" VARCHAR(20),
    "accept_invite" BOOLEAN,
    "is_family_member" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "UserInvites_pkey" PRIMARY KEY ("internal_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" USING HASH ("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users" USING HASH ("phone");

-- CreateIndex
CREATE INDEX "users_family_id_idx" ON "users"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_rolekey_key" ON "Roles"("rolekey");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_key_key" ON "Permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_and_Roles_userid_fk_roleid_fk_key" ON "User_and_Roles"("userid_fk", "roleid_fk");

-- CreateIndex
CREATE UNIQUE INDEX "Role_and_Permissions_roleid_fk_permissionid_fk_key" ON "Role_and_Permissions"("roleid_fk", "permissionid_fk");

-- CreateIndex
CREATE INDEX "users_audit_email_idx" ON "users_audit" USING HASH ("email");

-- CreateIndex
CREATE INDEX "users_audit_phone_idx" ON "users_audit" USING HASH ("phone");

-- CreateIndex
CREATE INDEX "users_audit_device_fingerprint_idx" ON "users_audit"("device_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "User_device_fingerprint_key" ON "User_device"("fingerprint");

-- CreateIndex
CREATE INDEX "User_device_fingerprint_idx" ON "User_device" USING HASH ("fingerprint");

-- CreateIndex
CREATE INDEX "Otp_Tokens_userid_fk_idx" ON "Otp_Tokens"("userid_fk");

-- CreateIndex
CREATE INDEX "Otp_Tokens_email_idx" ON "Otp_Tokens" USING HASH ("email");

-- CreateIndex
CREATE INDEX "Otp_Tokens_phone_idx" ON "Otp_Tokens" USING HASH ("phone");

-- CreateIndex
CREATE INDEX "RefreshTokens_userId_idx" ON "RefreshTokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_device_fingerprint_userId_key" ON "RefreshTokens"("device_fingerprint", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_Device_UserId_deviceid_fk_userid_fk_key" ON "User_Device_UserId"("deviceid_fk", "userid_fk");

-- CreateIndex
CREATE UNIQUE INDEX "family_trees_public_id_key" ON "family_trees"("public_id");

-- CreateIndex
CREATE INDEX "family_tree_admins_user_id_idx" ON "family_tree_admins"("user_id");

-- CreateIndex
CREATE INDEX "family_tree_admins_family_tree_id_idx" ON "family_tree_admins"("family_tree_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_tree_admins_user_id_family_tree_id_key" ON "family_tree_admins"("user_id", "family_tree_id");

-- CreateIndex
CREATE INDEX "family_tree_access_family_tree_id_idx" ON "family_tree_access"("family_tree_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_tree_access_user_id_family_tree_id_key" ON "family_tree_access"("user_id", "family_tree_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family_trees"("internal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_and_Roles" ADD CONSTRAINT "User_and_Roles_roleid_fk_fkey" FOREIGN KEY ("roleid_fk") REFERENCES "Roles"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_and_Roles" ADD CONSTRAINT "User_and_Roles_userid_fk_fkey" FOREIGN KEY ("userid_fk") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role_and_Permissions" ADD CONSTRAINT "Role_and_Permissions_roleid_fk_fkey" FOREIGN KEY ("roleid_fk") REFERENCES "Roles"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role_and_Permissions" ADD CONSTRAINT "Role_and_Permissions_permissionid_fk_fkey" FOREIGN KEY ("permissionid_fk") REFERENCES "Permissions"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_audit" ADD CONSTRAINT "users_audit_userid_fk_fkey" FOREIGN KEY ("userid_fk") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_audit" ADD CONSTRAINT "users_audit_device_fingerprint_fkey" FOREIGN KEY ("device_fingerprint") REFERENCES "User_device"("fingerprint") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_and_Roles_audit" ADD CONSTRAINT "User_and_Roles_audit_roleid_fk_fkey" FOREIGN KEY ("roleid_fk") REFERENCES "Roles"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_and_Roles_audit" ADD CONSTRAINT "User_and_Roles_audit_userid_change_fk_fkey" FOREIGN KEY ("userid_change_fk") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_and_Roles_audit" ADD CONSTRAINT "User_and_Roles_audit_useradmin_id_fkey" FOREIGN KEY ("useradmin_id") REFERENCES "users"("internal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp_Tokens" ADD CONSTRAINT "Otp_Tokens_userid_fk_fkey" FOREIGN KEY ("userid_fk") REFERENCES "users"("internal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp_Tokens" ADD CONSTRAINT "Otp_Tokens_devicefingerprint_fkey" FOREIGN KEY ("devicefingerprint") REFERENCES "User_device"("internal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("internal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_device_fingerprint_fkey" FOREIGN KEY ("device_fingerprint") REFERENCES "User_device"("fingerprint") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Device_UserId" ADD CONSTRAINT "User_Device_UserId_deviceid_fk_fkey" FOREIGN KEY ("deviceid_fk") REFERENCES "User_device"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Device_UserId" ADD CONSTRAINT "User_Device_UserId_userid_fk_fkey" FOREIGN KEY ("userid_fk") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_tree_admins" ADD CONSTRAINT "family_tree_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_tree_admins" ADD CONSTRAINT "family_tree_admins_family_tree_id_fkey" FOREIGN KEY ("family_tree_id") REFERENCES "family_trees"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_tree_access" ADD CONSTRAINT "family_tree_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_tree_access" ADD CONSTRAINT "family_tree_access_family_tree_id_fkey" FOREIGN KEY ("family_tree_id") REFERENCES "family_trees"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvites" ADD CONSTRAINT "UserInvites_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family_trees"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvites" ADD CONSTRAINT "UserInvites_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;
