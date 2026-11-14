import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo de imagen." },
        { status: 400 }
      );
    }

    // Validar tipo de imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo seleccionado debe ser una imagen (PNG, JPG, WEBP, SVG)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeFilename), buffer);

    const publicUrl = `/uploads/products/${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
    });
  } catch (error: any) {
    console.error("Error en API Upload:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al guardar la imagen." },
      { status: 500 }
    );
  }
}
