/** A thing that can be edited in the drawio editor: a code block or a file. */
export interface DrawioSource {
  /** Human label for the modal title. */
  title(): string;
  /** Current XML. */
  read(): Promise<string>;
  /** Persist new XML. */
  write(xml: string): Promise<void>;
}
