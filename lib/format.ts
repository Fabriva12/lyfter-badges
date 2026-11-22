export const EVENT_MODE_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  VIRTUAL: "Virtual",
  HYBRID: "Hybrid",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  FINISHED: "Finished",
};

export const BADGE_TYPE_LABELS: Record<string, string> = {
  WELCOME: "Welcome",
  TALK: "Talk",
  STAND: "Stand",
  SPECIAL: "Special",
};

export const BADGE_RARITY_LABELS: Record<string, string> = {
  COMMON: "Common",
  RARE: "Rare",
  LIMITED: "Limited edition",
};

export const ROLE_LABELS: Record<string, string> = {
  ATTENDEE: "Asistente",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "event.created": "Event created",
  "event.updated": "Event updated",
  "gallery.image_added": "Gallery image added",
  "gallery.image_removed": "Gallery image removed",
  "gallery.image_moved": "Gallery image moved",
  "gallery.cover_set": "Gallery cover changed",
  "badge.added": "Badge added",
  "badge.updated": "Badge schedule updated",
  "badge.catalog_updated": "Badge catalog updated",
  "badge.removed": "Badge removed",
  "badge.partner_assigned": "Partner assigned",
  "badge.partner_cleared": "Partner cleared",
  "qr_token.created": "QR token created",
  "qr_token.updated": "QR token updated",
  "prize.saved": "Prize saved",
  "event.deleted": "Event deleted",
  "company.created": "Company created",
  "company.admin_added": "Company admin added",
  "company.admin_removed": "Company admin removed",
  "user.role_changed": "User role changed",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export const AUDIT_ACTION_LABELS_ES: Record<string, string> = {
  "event.created": "Evento creado",
  "event.updated": "Evento actualizado",
  "gallery.image_added": "Imagen de galería agregada",
  "gallery.image_removed": "Imagen de galería eliminada",
  "gallery.image_moved": "Imagen de galería reordenada",
  "gallery.cover_set": "Portada de galería cambiada",
  "badge.added": "Badge agregado",
  "badge.updated": "Horario del badge actualizado",
  "badge.catalog_updated": "Catálogo de badges actualizado",
  "badge.removed": "Badge eliminado",
  "badge.partner_assigned": "Partner asignado",
  "badge.partner_cleared": "Partner removido",
  "qr_token.created": "Token QR creado",
  "qr_token.updated": "Token QR actualizado",
  "prize.saved": "Premio guardado",
  "event.deleted": "Evento eliminado",
  "company.created": "Empresa creada",
  "company.admin_added": "Admin de empresa agregado",
  "company.admin_removed": "Admin de empresa removido",
  "user.role_changed": "Rol de usuario cambiado",
};

export function auditActionLabelEs(action: string): string {
  return AUDIT_ACTION_LABELS_ES[action] ?? action;
}
