import { Children, isValidElement, type ReactNode } from 'react';

function optionText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(optionText).join('');
  if (isValidElement(node)) {
    return optionText((node.props as { children?: ReactNode }).children);
  }
  return '';
}

export function readOptions(children: ReactNode) {
  const options: { value: string; label: string; disabled?: boolean }[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = optionText(props.children).trim();
    options.push({
      value: String(props.value ?? ''),
      label: label || String(props.value ?? ''),
      disabled: props.disabled,
    });
  });
  return options;
}
