// iPhones save photos as HEIC by default - browsers can't preview it and our
// image pipeline (sharp/libvips, same thing next/image uses) can't render it
// either, so anything heic gets converted to a normal jpeg right when it's
// picked, before it's ever uploaded or previewed.
export async function normalizeImageFile(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.hei[cf]$/i.test(file.name);

  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(/\.hei[cf]$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}
