/**
 * FeedPostCard.jsx — a single feed post (status/photo/document) with its
 * like/comment/delete interactions. Used by the main feed, the profile
 * "Meine Beiträge" tab, and group detail feeds in FeedNetzwerk.jsx, so
 * every surface renders and behaves identically.
 */

import React, { useState } from "react";
import { Icon, PulseSvg, AvatarCircle, PostImageGrid, StreakBadge, timeAgo, formatFileSize } from "./feedShared";

export default function PostCard({ post, me, onLike, onDelete, onAddComment, onOpenLightbox, groupBadge }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const isMine = post.authorId === me.id;
  const isTeacher = (post.authorRole || "").toLowerCase().includes("lehrer");
  const isShortStatus = post.type === "status" && post.text.length <= 140 && !post.text.includes("\n\n");

  const submitComment = async () => {
    const text = commentDraft.trim();
    if (!text || sendingComment) return;
    setSendingComment(true);
    try {
      await onAddComment(post.id, text);
      setCommentDraft("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <article className="card fp-card" key={post.id}>
      <div className="post-head fp-head">
        <AvatarCircle name={post.authorName} size={44} avatarType={post.authorAvatarType} avatarIcon={post.authorAvatarIcon} avatarUrl={post.authorAvatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-name">
            {post.authorName}
            {isTeacher && <span className="role-badge-inline">Lehrer</span>}
            <StreakBadge count={post.streak} />
            {groupBadge && <span className="group-badge-inline">{groupBadge}</span>}
          </div>
          <div className="post-meta">{post.authorRole} · {timeAgo(post.createdAt)}</div>
        </div>
        {isMine && (
          <button className="fp-menu-btn" onClick={() => setMenuOpen(o => !o)}>
            <Icon name="dots" size={18} color="var(--muted)" />
          </button>
        )}
        {menuOpen && (
          <div className="fp-menu-dropdown">
            <button onClick={() => { setMenuOpen(false); onDelete(post.id); }}>
              <Icon name="trash" size={15} color="var(--like)" /> Beitrag löschen
            </button>
          </div>
        )}
      </div>

      {/* Status body */}
      {post.type === "status" && (
        isShortStatus ? (
          <div className="status-card">
            <div className="status-card-text">{post.text}</div>
            <div className="pulse-wrap"><PulseSvg /></div>
          </div>
        ) : (
          <p className="status-paragraph">{post.text}</p>
        )
      )}

      {/* Photo body */}
      {post.type === "photo" && (
        <>
          {post.text && <p className="caption-line"><b>{post.authorName}</b>{post.text}</p>}
          <PostImageGrid images={post.images} onOpen={(idx) => onOpenLightbox(post.images, idx)} />
        </>
      )}

      {/* Document body */}
      {post.type === "document" && (
        <>
          {post.text && <p className="post-text">{post.text}</p>}
          {post.document && (
            <div className="attachment-row">
              <div className="attachment-left">
                <div className="attachment-icon">
                  <Icon name="file" size={18} color="#DC2626" />
                </div>
                <div>
                  <div className="attachment-name">{post.document.name}</div>
                  <div className="attachment-meta">{formatFileSize(post.document.size)}</div>
                </div>
              </div>
              <a href={post.document.url} download={post.document.name} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <Icon name="download" size={17} color="var(--navy)" />
              </a>
            </div>
          )}
        </>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((t, idx) => <span key={idx}>{t}</span>)}
        </div>
      )}

      <div className="post-actions">
        <button className={`action-btn ${post.likedByMe ? "liked" : ""}`} onClick={() => onLike(post.id)}>
          <Icon name="heart" size={17} color={post.likedByMe ? "var(--like)" : "var(--muted)"} />
          <span>{post.likes}</span>
        </button>
        <button className="action-btn" onClick={() => setCommentsOpen(o => !o)}>
          <Icon name="message" size={17} color="var(--muted)" />
          <span>{post.comments.length}</span>
        </button>
        <button className="action-btn" onClick={() => alert("Link kopiert!")}>
          <Icon name="share" size={16} color="var(--muted)" />
        </button>
      </div>

      {commentsOpen && (
        <div className="comments-panel">
          {post.comments.length === 0 && <div className="comment-empty">Noch keine Kommentare. Sei der/die Erste!</div>}
          {post.comments.map(c => (
            <div className="comment-row" key={c.id}>
              <AvatarCircle name={c.authorName} size={28} fontSize={11} avatarType={c.authorAvatarType} avatarIcon={c.authorAvatarIcon} avatarUrl={c.authorAvatarUrl} />
              <div>
                <div className="comment-text"><b>{c.authorName}</b>{c.text}</div>
                <div className="comment-time">{timeAgo(c.createdAt)}</div>
              </div>
            </div>
          ))}
          <div className="comment-input-row">
            <AvatarCircle name={me.name} size={30} fontSize={11} avatarType={me.avatarType} avatarIcon={me.avatarIcon} avatarUrl={me.avatarUrl} />
            <input
              type="text"
              placeholder="Kommentar hinzufügen..."
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitComment(); }}
            />
            <button
              className="comment-send-btn"
              disabled={!commentDraft.trim() || sendingComment}
              onClick={submitComment}
            >
              <Icon name="send" size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
