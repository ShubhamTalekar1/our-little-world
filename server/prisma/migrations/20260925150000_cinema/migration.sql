-- CreateTable
CREATE TABLE "Showing" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "genre" TEXT NOT NULL DEFAULT '',
    "poster" TEXT,
    "palette" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "source" TEXT,
    "startsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Showing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showingKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "poster" TEXT,
    "palette" INTEGER NOT NULL DEFAULT 0,
    "seat" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Showing_coupleId_createdAt_idx" ON "Showing"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_coupleId_createdAt_idx" ON "Ticket"("coupleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_userId_showingKey_key" ON "Ticket"("userId", "showingKey");

-- AddForeignKey
ALTER TABLE "Showing" ADD CONSTRAINT "Showing_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

