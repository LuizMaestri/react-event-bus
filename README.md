# React Event Bus

Uma biblioteca React leve para despacho e escuta de eventos nativos, escrita em TypeScript. Substitui inteligentemente o uso verboso do `document.addEventListener` por APIs otimizadas para o ecossistema do React mantendo total isolamento e Typescript estrito.

## Vantagens
- **100% Typado**: Eventos mapeados são estritamente detectados para evitar digitação errada e facilitar o Auto-Complete.
- **Hook-Friendly**: Mantém a referência aos seus `callbacks` de componentes atualizada, evitando re-inscrições de eventos que sobrecarregam efeitos no React (evita gatilhos de `useEffect` desnecessários).
- **Sem DOM Poluído**: Usa instâncias privadas da API nativa `EventTarget` em vez da janela ou documento global, evitando sobreposição de eventos de diferentes origens.

---

## 💻 Como Usar

### 1. Definindo suas tipagens e eventos
Comece definindo um tipo único que dita os mapeamentos do nome do seu evento direto para o que ele trafega (a sua carga / payload).

```typescript
// types.ts
export type AppEvents = {
  // Um evento com payload detalhado:
  'user:login': { username: string; id: number };

  // Um evento simples "gatilho" sem dados:
  'ui:toggleSidebar': void;
};
```

---

### Abordagem A: Instância Global (Singleton)

Recomendado para casos de uso gerais de eventos soltos onde múltiplos locais do sistema sem ligação no mesmo Provider precisam interagir.

```tsx
// src/events.ts
import { createEventBus } from 'react-event-bus';
import { AppEvents } from './types';

// O export entrega as ferramentas amarradas a um escopo global isolado!
export const { useEvent, publish } = createEventBus<AppEvents>();
```

**Escutando em um Componente React:**
```tsx
import React, { useState } from 'react';
import { useEvent } from './events';

export const WelcomeHeader = () => {
  const [user, setUser] = useState<string | null>(null);

  useEvent('user:login', (data) => {
    // O seu editor (IDE) vai saber automaticamente que `data` 
    // possui a propridade `username` e `id`!
    setUser(`Bem-vindo, ${data.username}!`);
  });

  return <header>{user || 'Visitante'}</header>;
};
```

**Publicando um evento:**
```tsx
import { publish } from './events';

export const LoginForm = () => {
  const handleSuccess = () => {
    publish('user:login', { username: 'Luiz', id: 42 });
  };

  return <button onClick={handleSuccess}>Login</button>;
};
```

---

### Abordagem B: Scoped via Context API

Ideal para widgets isolados, microfrontends, ou partes que não deveriam vazar eventos globalmente para outras áreas do aplicativo caso houver instâncias simultâneas na mesma tela.

```tsx
import { createEventBusContext } from 'react-event-bus';
import { AppEvents } from './types';

export const { 
    EventBusProvider, 
    useEvent, 
    usePublish 
} = createEventBusContext<AppEvents>();

// 1. Abrace seu sub-app com o Provider. Todos dentro dele 
// vão enxergar o mesmo canal de eventos.
export const Dashboard = () => {
    return (
        <EventBusProvider>
            <Header />
            <Actions />
        </EventBusProvider>
    )
}

// 2. Acesse via hooks restritos ao Context
const Header = () => {
    useEvent('ui:toggleSidebar', () => {
        console.log('Sidebar Toggled!!');
    });
    return <div />;
}

const Actions = () => {
   const publish = usePublish();
   return <button onClick={() => publish('ui:toggleSidebar', undefined)}>Toggle</button>;
}
```

---

### 3. Classe Pura (Baixo Nível)

Para bibliotecas puras Vanilla JS conversarem com seu barramento de eventos abstraindo o React completamente:

```typescript
import { EventBus } from 'react-event-bus';

const coreBus = new EventBus<AppEvents>();

// Inscreve
const unsubscribe = coreBus.subscribe('user:login', (data) => {
    console.log(data.username);
});

// Emite
coreBus.publish('user:login', { username: 'Luiz', id: 42 });

// Limpa memória
unsubscribe();
```

---

### 🚀 Uso Avançado (Filtros e Debounce)

Tanto o \`useEvent\` quanto o método \`subscribe()\` nativo aceitam um terceiro argumento de opções para otimizar a performance da sua renderização:

```tsx
import { useEvent } from './events';

export const SearchAPI = () => {
    useEvent('search:queryChanged', (data) => {
         console.log(`Só chegamos aqui depois que você parar de digitar por 300ms, e se a palavra for maior que 3 letras:`, data.term);
    }, {
         // Opcional: Só executa se retornar true
         filter: (data) => data.term.length >= 3,
         
         // Opcional: Aguarda (debounce) os eventos pararem na origem pela quantidade de milissegundos abaixo
         debounce: 300,

         // Opcional: Nível de prioridade de execução (1 a 10). Padrão é 5.
         // Um listener com prioridade 1 sempre executa antes de um com prioridade 5.
         priority: 1 
    });

    return <div>...</div>;
};
```
