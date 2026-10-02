import { ListView } from "@/components/lists/ListView";

export const metadata = {
  title: "Encontrei um animal",
  description:
    "Registre um animal encontrado em Lages/SC. O sistema cruza automaticamente com anuncios de animais perdidos e sugere possiveis correspondencias.",
};

export default function Page() {
  return (
    <ListView
      mode="found"
      title="Encontrei um animal"
      lead="Tente o reencontro antes de resgatar. Se nao houver tutor em poucos dias, procure um protetor ou ONG parceira para guarda temporaria."
      ctaHref="/encontrados/novo"
      ctaLabel="Registrar animal encontrado"
    />
  );
}