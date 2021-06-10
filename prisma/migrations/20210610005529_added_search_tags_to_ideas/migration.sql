-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "ideaId" INTEGER,
    FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
