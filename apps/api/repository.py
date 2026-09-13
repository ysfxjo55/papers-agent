from sqlalchemy import select

from database import Session
from models import Edges, Messages, Nodes, Notebook, User, WaitlistEntry
from schema import Edge, GraphResponse, Message, Node


def get_notebook(notebook_id: str) -> GraphResponse:
    with Session() as session:
        notebook = session.get(Notebook, notebook_id)
        if notebook is None:
            raise ValueError(f"Notebook {notebook_id!r} not found")

        db_nodes = session.scalars(
            select(Nodes).where(Nodes.notebook_id == notebook_id)
        ).all()
        db_edges = session.scalars(
            select(Edges).where(Edges.notebook_id == notebook_id)
        ).all()
        db_messages = session.scalars(
            select(Messages).where(Messages.notebook_id == notebook_id)
        ).all()

        nodes = [
            Node(
                id=n.id,
                kind=n.kind,
                parent_id=n.parent_id,
                label=n.label,
                year=n.year,
                category=n.category,
                summary=n.summary,
                annotations=n.annotations or [],
                x=n.x,
                y=n.y,
            )
            for n in db_nodes
        ]

        edges = [
            Edge.model_validate({"from": e.from_id, "to": e.to_id, "type": e.type})
            for e in db_edges
        ]

        messages = [
            Message(role=m.role, content=m.content)
            for m in db_messages
        ]

        return GraphResponse(nodes=nodes, edges=edges, messages=messages)


def save_notebook(notebook_id: str, graph: GraphResponse):
    with Session() as db:
        try:
            existing = db.get(Notebook, notebook_id)
            if not existing:
                raise ValueError(f"Notebook {notebook_id!r} does not exist")

            db.query(Edges).filter(Edges.notebook_id == notebook_id).delete()
            db.query(Messages).filter(Messages.notebook_id == notebook_id).delete()
            db.query(Nodes).filter(Nodes.notebook_id == notebook_id).delete()

            new_nodes = [
                Nodes(
                    id=node.id,
                    notebook_id=notebook_id,
                    kind=node.kind,
                    parent_id=node.parent_id,
                    label=node.label,
                    year=node.year,
                    category=node.category,
                    summary=node.summary,
                    annotations=node.annotations or [],
                    x=node.x,
                    y=node.y,
                )
                for node in graph.nodes
            ]

            new_edges = [
                Edges(
                    from_id=edge.from_node,
                    to_id=edge.to,
                    notebook_id=notebook_id,
                    type=edge.type,
                )
                for edge in graph.edges
            ]

            new_messages = [
                Messages(
                    notebook_id=notebook_id,
                    role=message.role,
                    content=message.content,
                )
                for message in graph.messages
            ]

            if new_nodes:
                db.add_all(new_nodes)
            if new_edges:
                db.add_all(new_edges)
            if new_messages:
                db.add_all(new_messages)

            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Failed to save notebook {notebook_id}: {str(e)}")
            raise e


def reset_notebook(notebook_id: str) -> GraphResponse:
    empty = GraphResponse(nodes=[], edges=[], messages=[])
    save_notebook(notebook_id, empty)
    return empty


def add_waitlist_entry(email: str, source: str, note: str | None = None) -> None:
    with Session() as session:
        session.add(WaitlistEntry(email=email, source=source, note=note))
        session.commit()


def get_user_by_email(email: str) -> User | None:
    with Session() as session:
        return session.scalar(select(User).where(User.email == email))


def get_user_by_id(user_id: int) -> User | None:
    with Session() as session:
        return session.get(User, user_id)


def create_user(name: str, email: str, hashed_password: str) -> User:
    with Session() as session:
        user = User(name=name, email=email, hashed_password=hashed_password)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


def mark_email_verified(user_id: int) -> None:
    with Session() as session:
        user = session.get(User, user_id)
        if user is not None:
            user.email_verified = True
            session.commit()
