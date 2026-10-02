import { ListView } from "@/components/lists/ListView";

export const metadata = {
  title: "Perdi meu animal",
  description:
    "Anuncie animal perdido em Lages/SC com contato mediado. O sistema cruzaspecies, cor, porte, bairro, distancia e data para sugerir possiveis correspondencias.",
};

export default function Page() {
  return (
    <ListView
      mode="lost"
      title="Perdi meu animal"
      lead="Anuncie com characteristics que permitam identificacao: cor, tamanho, coleira, microchip, marcas. Quanto mais preciso, maior a chance de reencontro."
      ctaHref="/perdidos/novo"
      ctaLabel="Anunciar animal perdido"
    />
  );
}