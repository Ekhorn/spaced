import { FaSolidFileImport } from 'solid-icons/fa';

import { type Item } from '../../lib/types.js';
import { useIPC } from '../IPCProvider.js';
import { useState } from '../StateProvider.jsx';

async function base64ToArray(base64String: string) {
  const response = await fetch(base64String);
  return [...new Uint8Array(await response.arrayBuffer())];
}

export function ImportButton() {
  const { createItem } = useIPC();
  const { setItems } = useState();

  async function handleChange(event: Event) {
    // @ts-expect-error the files should exist
    const [jsonFile] = event.target!.files as FileList;
    const json: (Item & { file?: string })[] = JSON.parse(
      await jsonFile.text(),
    );
    const items = (await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      json.map(async ({ id, ...item }) => ({
        ...item,
        file: item.file ? await base64ToArray(item.file) : undefined,
      })),
    )) as Item[];
    for (const item of items) {
      await createItem(item);
    }
    setItems(items);
  }

  return (
    <div>
      <label
        for="import"
        class="z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
        title="import"
      >
        <FaSolidFileImport />
      </label>
      <input
        id="import"
        type="file"
        class="hidden"
        onChange={handleChange}
      ></input>
    </div>
  );
}
