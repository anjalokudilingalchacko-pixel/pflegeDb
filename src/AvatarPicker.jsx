/**
 * AvatarPicker.jsx — profile photo / avatar picker modal. Two ways in:
 * upload a real photo, or pick from a curated icon gallery filterable by
 * a couple of self-picked interest tags. Backed by POST /api/profile/avatar.
 */

import React, { useState } from "react";
import { Icon, AvatarCircle, AVATAR_ICONS, apiSetAvatar } from "./feedShared";

const ALL_TAGS = [...new Set(AVATAR_ICONS.flatMap(i => i.tags))].sort();

export default function AvatarPicker({ isOpen, onClose, currentUser, onSaved }) {
  const [tab, setTab] = useState("icon"); // 'icon' | 'photo'
  const [activeTags, setActiveTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null); // { file, previewUrl }

  if (!isOpen || !currentUser) return null;

  const visibleIcons = activeTags.length === 0
    ? AVATAR_ICONS
    : AVATAR_ICONS.filter(i => i.tags.some(t => activeTags.includes(t)));

  const toggleTag = (tag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const pickIcon = async (iconId) => {
    setSaving(true);
    setError("");
    try {
      const { user } = await apiSetAvatar({ type: "icon", icon: iconId });
      onSaved(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Bitte eine Bilddatei auswählen."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Datei ist zu groß (max. 8 MB)."); return; }
    setError("");
    setPhotoFile({ file, previewUrl: URL.createObjectURL(file) });
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setSaving(true);
    setError("");
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(photoFile.file);
      });
      const { user } = await apiSetAvatar({ type: "photo", dataUrl });
      URL.revokeObjectURL(photoFile.previewUrl);
      setPhotoFile(null);
      onSaved(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (photoFile) URL.revokeObjectURL(photoFile.previewUrl);
    setPhotoFile(null);
    setError("");
    onClose();
  };

  return (
    <div className="avpick-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <style>{AVATAR_PICKER_CSS}</style>
      <div className="avpick-modal">
        <div className="avpick-head">
          <h3>Profilbild</h3>
          <button className="avpick-close" onClick={handleClose}><Icon name="x" size={16} color="#334155" /></button>
        </div>

        <div className="avpick-current">
          <AvatarCircle
            name={currentUser.name}
            size={64}
            avatarType={currentUser.avatarType}
            avatarIcon={currentUser.avatarIcon}
            avatarUrl={currentUser.avatarUrl}
          />
          <div className="avpick-current-name">{currentUser.name}</div>
        </div>

        <div className="avpick-tabs">
          <button className={`avpick-tab ${tab === "icon" ? "active" : ""}`} onClick={() => setTab("icon")}>Avatar wählen</button>
          <button className={`avpick-tab ${tab === "photo" ? "active" : ""}`} onClick={() => setTab("photo")}>Foto hochladen</button>
        </div>

        {error && <div className="avpick-error">{error}</div>}

        {tab === "icon" && (
          <>
            <div className="avpick-tag-row">
              <button className={`avpick-tag ${activeTags.length === 0 ? "active" : ""}`} onClick={() => setActiveTags([])}>Alle</button>
              {ALL_TAGS.map(tag => (
                <button key={tag} className={`avpick-tag ${activeTags.includes(tag) ? "active" : ""}`} onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="avpick-icon-grid">
              {visibleIcons.map(icon => (
                <button
                  key={icon.id}
                  className={`avpick-icon-btn ${currentUser.avatarType === "icon" && currentUser.avatarIcon === icon.id ? "selected" : ""}`}
                  disabled={saving}
                  onClick={() => pickIcon(icon.id)}
                  title={icon.label}
                >
                  <Icon name={icon.id} size={22} color="#16305C" strokeWidth={1.8} />
                  <span>{icon.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "photo" && (
          <div className="avpick-photo-block">
            <label className="avpick-filepick">
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              <Icon name="camera" size={20} color="#16305C" />
              {photoFile ? "Anderes Foto wählen" : "Foto auswählen"}
            </label>
            {photoFile && (
              <div className="avpick-photo-preview">
                <img src={photoFile.previewUrl} alt="Vorschau" />
                <button className="avpick-upload-btn" disabled={saving} onClick={uploadPhoto}>
                  {saving ? "Wird gespeichert…" : "Als Profilbild speichern"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const AVATAR_PICKER_CSS = `
  .avpick-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.6); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .avpick-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 460px; padding: 24px; max-height: 90vh; overflow-y: auto; font-family: 'Inter', sans-serif; }
  .avpick-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .avpick-head h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 17px; color: #16213D; }
  .avpick-close { background: #F1F4FA; border: none; border-radius: 999px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  .avpick-current { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 18px; }
  .avpick-current-name { font-weight: 700; font-size: 13.5px; color: #16213D; }

  .avpick-tabs { display: flex; gap: 4px; background: #F1F4FA; border-radius: 10px; padding: 4px; margin-bottom: 14px; }
  .avpick-tab { flex: 1; background: none; border: none; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 12.5px; color: #64748B; cursor: pointer; }
  .avpick-tab.active { background: #fff; color: #16213D; box-shadow: 0 2px 6px rgba(0,0,0,.08); }

  .avpick-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 12px; }

  .avpick-tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .avpick-tag { background: #fff; border: 1px solid #E4E8F1; border-radius: 999px; padding: 5px 12px; font-size: 11.5px; font-weight: 600; cursor: pointer; color: #334155; }
  .avpick-tag.active { background: #16305C; border-color: #16305C; color: #fff; }

  .avpick-icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .avpick-icon-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px; border-radius: 12px; border: 1.5px solid #E4E8F1; background: #fff; cursor: pointer; }
  .avpick-icon-btn span { font-size: 10.5px; font-weight: 600; color: #64748B; text-align: center; }
  .avpick-icon-btn:hover { border-color: #0D9488; }
  .avpick-icon-btn.selected { border-color: #0D9488; background: #EFFAF7; }
  .avpick-icon-btn:disabled { opacity: .6; cursor: default; }

  .avpick-photo-block { display: flex; flex-direction: column; gap: 14px; align-items: center; }
  .avpick-filepick { display: flex; align-items: center; gap: 8px; background: #F1F4FA; border: 1.5px dashed #E4E8F1; border-radius: 12px; padding: 13px 18px; font-size: 13px; font-weight: 700; color: #16305C; cursor: pointer; width: 100%; justify-content: center; box-sizing: border-box; }
  .avpick-photo-preview { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
  .avpick-photo-preview img { width: 120px; height: 120px; border-radius: 999px; object-fit: cover; }
  .avpick-upload-btn { width: 100%; background: #0D9488; color: #fff; border: none; border-radius: 10px; padding: 11px; font-weight: 700; font-size: 13px; cursor: pointer; }
  .avpick-upload-btn:disabled { opacity: .6; cursor: default; }
`;
