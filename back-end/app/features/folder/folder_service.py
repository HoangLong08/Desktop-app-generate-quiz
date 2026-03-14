import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional

from app.db import db
from app.features.folder.models import Folder


def get_all_folders() -> List[Dict]:
    """Retrieve all folders from SQLite."""
    folders = Folder.query.order_by(Folder.created_at).all()
    return [f.to_dict() for f in folders]


def create_folder(name: str, description: str = "", color: str = "") -> Dict:
    """Create a new folder in SQLite."""
    folder = Folder(
        id=str(uuid.uuid4()),
        name=name.strip(),
        description=description.strip() if description else "",
        color=color if color else "hsl(262 83% 58%)",
    )
    db.session.add(folder)
    db.session.commit()
    return folder.to_dict()


def update_folder(folder_id: str, data: Dict) -> Optional[Dict]:
    """Update an existing folder."""
    folder = Folder.query.get(folder_id)
    if not folder:
        return None
    if "name" in data:
        folder.name = data["name"].strip()
    if "description" in data:
        folder.description = data["description"].strip()
    if "color" in data:
        folder.color = data["color"]
    db.session.commit()
    return folder.to_dict()


def delete_folder(folder_id: str) -> bool:
    """Delete a folder by ID (quiz_sets belonging to it get folder_id set to NULL)."""
    folder = Folder.query.get(folder_id)
    if not folder:
        return False
    db.session.delete(folder)
    db.session.commit()
    return True


def toggle_favorite(folder_id: str) -> Optional[Dict]:
    """Toggle the is_favorite flag on a folder."""
    folder = Folder.query.get(folder_id)
    if not folder:
        return None
    folder.is_favorite = not folder.is_favorite
    db.session.commit()
    return folder.to_dict()


def record_access(folder_id: str) -> Optional[Dict]:
    """Update last_accessed_at to now."""
    folder = Folder.query.get(folder_id)
    if not folder:
        return None
    folder.last_accessed_at = datetime.now(timezone.utc)
    db.session.commit()
    return folder.to_dict()
