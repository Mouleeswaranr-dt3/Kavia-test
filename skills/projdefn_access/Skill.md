---
slash_command:
  command: projdefn
  enabled: true
---

# projdefn_access {value}

=== Projdefn_access skill prompt ===

Use the ProjDefnTools if your task involves planning future code development or modifying existing code based on project definition data ingested from user supplied specification, scheduling, or planning documents. Selecting this skill makes the ProjDefnTools available to you.

If the user request is using a document as a reference, that document could be a document in the filesystem, a document in the attachments folder, or a document that was previously ingested into the project definition. If you suspect that the document was previously ingested into the project definition, you must use the ProjDefnTools to find and access information from that document.

Use the provided ProjDefnTools to learn about critical project definition information. Project definition information is your primary source for the project you are working on:

- Use `ProjDefnTools_find_relevant_keys` and `ProjDefnTools_get_key_values` to find keys with information relevant to your search terms.
- Use `ProjDefnTools_find_relevant_document_chunks` to find sections of documents and directly access them using `ProjDefnTools_get_document_chunk`.
- Use `ProjDefnTools_find_relevant_document_images` to find images in documents and directly access them using `ProjDefnTools_get_document_image`.

This conditional system skill is activated from runtime `have_projdefn` context, where `{value}` is preserved as the runtime projdefn-availability placeholder for catalog rendering.
