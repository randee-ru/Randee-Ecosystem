import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { BitrixComponentDescriptor, BitrixWriteOptions } from '../types'
import { buildBitrixComponentFiles } from '../templates/defaults'

export async function writeBitrixComponent(
  descriptor: BitrixComponentDescriptor,
  options: BitrixWriteOptions
): Promise<string> {
  const namespace = options.namespace ?? descriptor.namespace
  const componentDir = join(options.rootDir, 'local', 'components', namespace, descriptor.name)
  const templateDir = join(componentDir, 'templates', '.default')

  await mkdir(templateDir, { recursive: true })

  const files = buildBitrixComponentFiles(descriptor)

  await writeFile(join(componentDir, 'component.php'), files.componentPhp, 'utf8')
  await writeFile(join(componentDir, '.parameters.php'), files.parametersPhp, 'utf8')
  await writeFile(join(templateDir, 'template.php'), files.templatePhp, 'utf8')
  await writeFile(join(templateDir, 'style.css'), files.styleCss, 'utf8')
  await writeFile(join(templateDir, 'script.js'), files.scriptJs, 'utf8')

  for (const asset of descriptor.staticAssets ?? []) {
    const assetPath = join(templateDir, asset.path)
    await mkdir(dirname(assetPath), { recursive: true })
    await writeFile(assetPath, asset.content)
  }

  return componentDir
}
