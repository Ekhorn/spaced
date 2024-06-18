import { FaSolidFileExport } from 'solid-icons/fa';

import { useIPC } from '../IPCProvider.js';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function bufferToBase64(blob: Blob) {
  const base64url: string = await new Promise((r) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => r(reader.result as string));
    reader.readAsDataURL(blob);
  });
  return base64url.slice(base64url.indexOf(',') + 1);
}

export function ExportButton() {
  const { getNearByItems } = useIPC();

  async function handleClick() {
    try {
      const items = await getNearByItems();
      const serializableItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          file: item.file
            ? await bufferToBase64(
                new Blob([new Uint8Array(item.file)], { type: item.mime }),
              )
            : undefined,
        })),
      );
      const result = JSON.stringify(serializableItems);

      downloadBlob(
        new Blob([result], { type: 'application/json' }),
        'spaced.json',
      );
    } catch {
      /**/
    }
  }

  return (
    <button
      class="z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
      title="export"
      onClick={handleClick}
    >
      <FaSolidFileExport />
    </button>
  );
}
