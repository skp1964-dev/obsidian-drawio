export const DRAWIO_VIEW_TYPE = 'drawio-file-view';
export const DRAWIO_CODE_BLOCK_LANG = 'drawio';
export const DRAWIO_FILE_EXT = 'drawio';

/** Default empty mxfile diagram. */
export const EMPTY_DIAGRAM =
  '<mxfile><diagram id="0" name="Page-1"><mxGraphModel dx="800" dy="600" grid="1" ' +
  'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" ' +
  'pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">' +
  '<root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

/** drawio embed iframe URL query params. `configure=1` lets us disable XML
 *  compression so saved diagrams are readable (and code blocks are formattable). */
export function buildEmbedQuery(opts: { dark: boolean; libraries: boolean }): string {
  const p = new URLSearchParams({ embed: '1', proto: 'json', spin: '1', configure: '1' });
  if (opts.libraries) p.set('libraries', '1');
  if (opts.dark) p.set('dark', '1');
  return p.toString();
}
