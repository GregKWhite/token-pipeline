import {promises as fs} from 'fs';
import {format, resolveConfig} from 'prettier';

/**
 * Run prettier on the file at the given path. This function will read the file,
 * format it, and write it back to the same path.
 * @param filePath The path of the file to format
 */
export async function runPrettier(filePath: string) {
  const content = await fs.readFile(filePath, {encoding: 'utf-8'});
  const config = (await resolveConfig(filePath)) ?? {};
  const formatted = format(content, {...config, filepath: filePath});

  await fs.writeFile(filePath, formatted);
}
