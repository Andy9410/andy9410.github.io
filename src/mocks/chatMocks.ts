import type { Conversation } from "@/types/chat";

const now = new Date();
const mins = (n: number) => new Date(now.getTime() - n * 60 * 1000);

export const mockConversations: Conversation[] = [
  {
    id: "mock-1",
    title: "Dudas sobre álgebra lineal",
    createdAt: mins(120),
    updatedAt: mins(5),
    messages: [
      {
        id: "m1-1",
        role: "user",
        content:
          "Hola! Tengo un parcial de álgebra lineal la próxima semana y no entiendo bien el concepto de espacio vectorial. ¿Podés explicarme?",
        timestamp: mins(15),
      },
      {
        id: "m1-2",
        role: "assistant",
        content: `¡Hola! Claro que sí, te explico el concepto de **espacio vectorial** de manera sencilla.

Un espacio vectorial es un conjunto de objetos (llamados vectores) que cumplen ciertas reglas fundamentales. La idea clave es que podés **sumar vectores** entre sí y **multiplicarlos por escalares** (números reales), y el resultado siempre va a pertenecer al mismo conjunto.

**Las reglas básicas son:**

- Suma de vectores: si tomás dos vectores del espacio, su suma también está en el espacio
- Multiplicación por escalar: si multiplicás un vector por cualquier número real, el resultado sigue en el espacio

**Ejemplo concreto:**
El plano R² es un espacio vectorial clásico. Si tenés los vectores (2, 3) y (1, -1), su suma (3, 2) también está en R².

¿Querés que profundicemos en algún aspecto específico, como la independencia lineal o las bases?`,
        timestamp: mins(14),
      },
      {
        id: "m1-3",
        role: "user",
        content: "Sí! ¿Qué es exactamente una base de un espacio vectorial?",
        timestamp: mins(10),
      },
      {
        id: "m1-4",
        role: "assistant",
        content: `Una **base** de un espacio vectorial es un conjunto de vectores que tiene dos propiedades clave:

1. **Linealmente independientes**: ningún vector del conjunto puede escribirse como combinación lineal de los otros
2. **Generadores del espacio**: cualquier vector del espacio puede expresarse como combinación lineal de los vectores de la base

**Ejemplo en R²:**
Los vectores **(1, 0)** y **(0, 1)** forman la base canónica. Cualquier vector (a, b) se puede escribir como:

\`a·(1,0) + b·(0,1)\`

La **dimensión** del espacio es justamente el número de vectores en cualquier base. Para R², la dimensión es 2.

¿Te ayudo con algún ejercicio de práctica para el parcial?`,
        timestamp: mins(9),
      },
    ],
  },
  {
    id: "mock-2",
    title: "Preparación examen de cálculo",
    createdAt: mins(300),
    updatedAt: mins(60),
    messages: [
      {
        id: "m2-1",
        role: "user",
        content: "Necesito ayuda con derivadas implícitas. Tengo el examen mañana.",
        timestamp: mins(70),
      },
      {
        id: "m2-2",
        role: "assistant",
        content: `¡Perfecto, vamos a repasar las derivadas implícitas!

La derivación implícita se usa cuando tenés una ecuación donde **y no está despejada** explícitamente. El truco es derivar ambos lados respecto a x, recordando que y es función de x.

**Regla fundamental:** cada vez que derivás un término con y, multiplicás por dy/dx.

**Ejemplo:** Dada la ecuación x² + y² = 25, encontrá dy/dx.

Derivando ambos lados: \`2x + 2y·(dy/dx) = 0\`

Despejando: \`dy/dx = -x/y\`

**Tips para el examen:**
- Siempre derivá ambos lados simultáneamente
- Agrupá todos los términos con dy/dx del mismo lado
- Despejá dy/dx al final

¿Querés que practiquemos con algunos ejercicios típicos de examen?`,
        timestamp: mins(68),
      },
    ],
  },
  {
    id: "mock-3",
    title: "OOP en Python para la carrera",
    createdAt: mins(1440),
    updatedAt: mins(480),
    messages: [
      {
        id: "m3-1",
        role: "user",
        content: "¿Podés explicarme la diferencia entre herencia y composición en OOP?",
        timestamp: mins(490),
      },
      {
        id: "m3-2",
        role: "assistant",
        content: `¡Buena pregunta! Esta es una distinción fundamental en programación orientada a objetos.

**Herencia** ("es un"): Una clase hija hereda comportamiento de una clase padre.

\`\`\`python
class Animal:
    def respirar(self):
        return "inhalo aire"

class Perro(Animal):
    def ladrar(self):
        return "Guau!"

mi_perro = Perro()
mi_perro.respirar()  # funciona por herencia
\`\`\`

**Composición** ("tiene un"): Una clase contiene instancias de otras clases como atributos.

\`\`\`python
class Motor:
    def encender(self):
        return "vroom"

class Auto:
    def __init__(self):
        self.motor = Motor()

    def arrancar(self):
        return self.motor.encender()
\`\`\`

**¿Cuándo usar cada una?**
- Herencia cuando hay una relación jerárquica natural y clara
- Composición cuando querés más flexibilidad (preferida en la práctica moderna)

La regla general: **"favorecé la composición sobre la herencia"**.`,
        timestamp: mins(488),
      },
    ],
  },
];

const responses: string[] = [
  `Entendido. Vamos a trabajar eso juntos.

Lo más importante es entender el **concepto base** antes de avanzar. Una vez que tenés eso claro, los ejercicios se vuelven mucho más manejables.

**Pasos recomendados:**
- Revisá la teoría fundamental del tema
- Practicá con ejemplos simples primero
- Aumentá la complejidad gradualmente

¿Hay algún aspecto puntual donde te trabás?`,

  `¡Excelente pregunta! Esto es algo que confunde a muchos estudiantes al principio.

La clave está en entender la diferencia conceptual, no solo memorizar fórmulas. Cuando comprendés *por qué* algo funciona de cierta manera, es mucho más fácil aplicarlo en situaciones nuevas.

¿Querés que trabajemos con un ejemplo concreto para afianzar el concepto?`,

  `Perfecto, te ayudo con eso.

Antes de darte la respuesta directa, quiero que intentes pensar en esto: ¿qué información tenés disponible y qué te están pidiendo encontrar?

Este ejercicio de **análisis previo** es fundamental para resolver problemas correctamente en un examen. Una vez que identifiques eso, el camino se hace más claro.

Contame qué identificaste y seguimos desde ahí.`,

  `Muy buena duda. Este tema tiene una lógica interna que, una vez que la captás, todo el resto cae en su lugar.

**Concepto central:**
Los conceptos en esta área están profundamente interrelacionados. No se pueden entender de forma aislada, sino como parte de un sistema coherente.

**Mi recomendación:**
Trabajá siempre con ejemplos numéricos concretos antes de abstraer. La intuición se construye desde lo particular hacia lo general.

¿Seguimos profundizando o necesitás que vuelva a algún punto anterior?`,
];

let responseIndex = 0;

export const generateMockResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();

  if (lower.includes("hola") || lower.includes("buenas") || lower.includes("hey")) {
    return `¡Hola! Soy tu tutor de LearnSoft. Estoy aquí para ayudarte con tus estudios.

¿En qué materia o tema necesitás ayuda hoy? Puedo asistirte con matemáticas, programación, física, y mucho más.`;
  }

  if (lower.includes("gracias") || lower.includes("perfecto") || lower.includes("entendí")) {
    return `¡Me alegra que haya quedado claro!

Recordá que podés volver a consultarme cuando tengas dudas. El aprendizaje es un proceso continuo, así que no dudes en preguntar las veces que necesitás.

¡Éxitos con tus estudios! 🎯`;
  }

  const response = responses[responseIndex % responses.length];
  responseIndex++;
  return response;
};
