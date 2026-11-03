import { CmsEditor } from "@/components/admin/cms-editor";
import { requireAdminPage } from "@/server/auth/pages";
import { getDatabase } from "@/server/db/connection";
import { cmsStore } from "@/server/cms/store";
export default async function Page() {
  const { principal } = await requireAdminPage("content:manage", "/admin/website");
  return <CmsEditor initial={await cmsStore(getDatabase(), principal).read()} />;
}
