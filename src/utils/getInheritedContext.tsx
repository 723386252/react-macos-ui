import React from 'react';
import ReactDOM from 'react-dom';

export function getInheritedContext(sourceElement: Element) {
  const contexts: any[] = [];
  let element = sourceElement;

  while (element) {
    const context = (element as any)._reactInternals?.alternate?.memoizedState?.baseState;
    if (context) {
      contexts.push(context);
    }
    element = element.parentElement as Element;
  }

  return contexts;
} 