import type { Linter } from 'eslint';

export async function prettier(): Promise<Linter.Config[]> {
  const { default: pluginPrettier } = await import('eslint-plugin-prettier');
  const { default: configPrettier } = await import('eslint-config-prettier');

  return [
    {
      ...configPrettier,
      plugins: {
        prettier: pluginPrettier,
      },
      rules: {
        ...configPrettier.rules,
        'prettier/prettier': 'warn',
      },
    },
  ];
}
