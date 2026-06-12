export interface Tag {
    id:string
    name:string
    created_at:string|null
}
export interface NoteTag{
    note_id:string
    tag_id:string
}