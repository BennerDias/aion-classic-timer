import type { Event } from "@/types/event"

export const events: Event[] = [
  {
    id: "1",
    name: "Dredgion",
    day: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
    openTimes: ["07:00", "12:00", "18:00"], // Abre 3x por dia
    duration: 120, // Permanece aberto por 2 horas (120 minutos)
    image: "/images/events/Dredgion.webp",
    status: "closed",
  },
  {
    id: "2",
    name: "Arena of Cooperation",
    day: [3, 4, 5, 6], // Quinta à domingo
    time: "13:00",
    duration: 360, // 6 horas
    image: "/images/events/ArenaOfCooperation.webp",
    status: "closed",
  },
  {
    id: "3",
    name: "Arena of Discipline",
    day: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
    time: "13:00",
    duration: 360, // 6 horas
    image: "/images/events/ArenaOfDiscipline.webp",
    status: "closed",
  },
  {
    id: "4",
    name: "Arena of Chaos",
    day: [3, 4, 5, 6], // Quinta à domingo
    time: "13:00",
    duration: 360, // 6 horas
    image: "/images/events/ArenaOfGlory.webp",
    status: "closed",
  },
  {
    id: "5",
    name: "Gelkmaros / Inggison siege",
    day: 5, // Sábado
    time: "17:00",
    duration: 60, // 1 hora
    image: "/images/events/GelkSiege.webp",
    status: "closed",
  },
  {
    id: "6",
    name: "Apheta Beluslan siege",
    day: [2, 6], // Quarta e domingo
    time: "17:00",
    duration: 60, // 1 hora
    image: "/images/events/AphetaSiege.webp",
    status: "closed",
  },
  {
    id: "7",
    name: "Zantra/Nuzanta - Inggi/Gelk",
    day: 0, // Segunda
    time: "17:00",
    duration: 60, // 1 hora
    image: "/images/events/Zantra.webp", // Atualizado para a nova imagem
    status: "closed",
  },
  {
    id: "8",
    name: "Tiarkh Testing Lab",
    day: [1, 3, 5, 6], // Terça, quinta, sábado e domingo
    time: "14:00",
    duration: 120, // 2 horas
    image: "/images/events/Tiark.webp",
    status: "closed",
  },
  {
    id: "9",
    name: "Dranium Battlefield",
    day: [0, 2, 4], // Segunda, quarta, sexta
    time: "14:00",
    duration: 120, // 2 horas
    image: "/images/events/Dranium.webp",
    status: "closed",
  },
  {
    id: "10",
    name: "Arch Dyad Laphsaran",
    day: 4, // Sexta, a cada 2 semanas
    time: "17:30",
    duration: 60, // 1 hora
    image: "/images/events/ArchDyad.jpg", // Atualizado para a nova imagem
    status: "closed",
  },
  {
    id: "11",
    name: "Haettoda Laphsaran",
    day: 4, // Sexta, a cada 2 semanas
    time: "17:30",
    duration: 60, // 1 hora
    image: "/images/events/Haettoda.jpg",
    status: "closed",
  },
  {
    id: "12",
    name: "Subterra Raid Boss",
    day: 5, // Sabado
    time: "18:00",
    duration: 60, // 1 hora
    image: "/images/events/Subterra.webp",
    status: "closed",
  },
]
