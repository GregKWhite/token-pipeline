import {promises as fs} from 'fs';
import {format, resolveConfig} from 'prettier';

export async function runPrettier(filePath: string) {
  const content = await fs.readFile(filePath, {encoding: 'utf-8'});
  const config = (await resolveConfig(filePath)) ?? {};
  const formatted = format(content, {...config, filepath: filePath});

  await fs.writeFile(filePath, formatted);
}
