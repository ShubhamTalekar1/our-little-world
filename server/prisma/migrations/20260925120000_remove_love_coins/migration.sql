-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WardrobeItem" DROP CONSTRAINT "WardrobeItem_userId_fkey";

-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "ownedAccessories";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "owned";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "Wallet";

-- DropTable
DROP TABLE "WardrobeItem";

