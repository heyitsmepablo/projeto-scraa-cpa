-- AlterTable
ALTER TABLE "sigtap_changelog" DROP CONSTRAINT "sigtap_changelog_importacao_id_fkey";

ALTER TABLE "sigtap_changelog" ADD CONSTRAINT "sigtap_changelog_importacao_id_fkey" 
    FOREIGN KEY ("importacao_id") REFERENCES "sigtap_importacao"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE 
    DEFERRABLE INITIALLY DEFERRED;