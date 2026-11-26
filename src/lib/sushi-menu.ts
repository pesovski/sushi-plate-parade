import type { ConveyorDish } from "@/components/ui/sushi-conveyor-menu";
import salmon_nigiri from "@/assets/salmon-nigiri.webp.asset.json";
import tuna_nigiri from "@/assets/tuna-nigiri.webp.asset.json";
import ebi_nigiri from "@/assets/ebi-nigiri.webp.asset.json";
import california_roll from "@/assets/california-roll.webp.asset.json";
import dragon_roll from "@/assets/dragon-roll.webp.asset.json";
import tamago from "@/assets/tamago.webp.asset.json";
import edamame from "@/assets/edamame.webp.asset.json";
import mochi from "@/assets/mochi.webp.asset.json";

export const SUSHI_BELT_DISHES: ConveyorDish[] = [
  {
    id: "salmon-nigiri",
    name: "Salmon nigiri",
    price: "$4.20",
    tier: 2,
    description: "Two slices of fresh salmon over seasoned rice, with pickled ginger.",
    details: ["2 pieces", "Fish", "Chef's pick"],
    image: salmon_nigiri.url,
  },
  {
    id: "tuna-nigiri",
    name: "Tuna nigiri",
    price: "$6.80",
    tier: 4,
    description: "Lean red tuna over warm rice on a black lacquer plate.",
    details: ["2 pieces", "Fish"],
    image: tuna_nigiri.url,
  },
  {
    id: "ebi-nigiri",
    name: "Ebi nigiri",
    price: "$4.20",
    tier: 2,
    description: "Butterflied poached shrimp over rice, tail left on.",
    details: ["2 pieces", "Shellfish"],
    image: ebi_nigiri.url,
  },
  {
    id: "california-roll",
    name: "California roll",
    price: "$5.40",
    tier: 3,
    description: "Crab, avocado and cucumber, rolled inside out in orange tobiko.",
    details: ["4 pieces", "Shellfish", "Fish roe"],
    image: california_roll.url,
  },
  {
    id: "dragon-roll",
    name: "Dragon roll",
    price: "$8.50",
    tier: 5,
    description: "Shrimp tempura roll draped in avocado, finished with eel sauce.",
    details: ["4 pieces", "Shellfish", "Wheat", "Chef's pick"],
    image: dragon_roll.url,
  },
  {
    id: "tamago",
    name: "Tamago nigiri",
    price: "$3.20",
    tier: 1,
    description: "Sweet rolled omelette tied to rice with a band of nori.",
    details: ["2 pieces", "Egg"],
    image: tamago.url,
  },
  {
    id: "edamame",
    name: "Salted edamame",
    price: "$3.20",
    tier: 1,
    description: "A small bowl of steamed soybean pods with flaky sea salt.",
    details: ["1 bowl", "Soy", "Vegan"],
    image: edamame.url,
  },
  {
    id: "mochi",
    name: "Mochi ice cream",
    price: "$5.40",
    tier: 3,
    description: "Matcha and strawberry mochi ice cream, one of each.",
    details: ["2 pieces", "Milk", "Dessert"],
    image: mochi.url,
  },
];

export const SUSHI_BELT_LEGEND = { 1: "$3.20", 2: "$4.20", 3: "$5.40", 4: "$6.80", 5: "$8.50" };

