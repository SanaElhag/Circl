import RequestView from "./RequestView";

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RequestView requestId={id} />;
}
