from schema import Edge, GraphResponse, Message, Node

seed_data = GraphResponse(
        nodes=[
            Node(
                id="transformer",
                kind="paper",
                label="Transformer",
                 year=2017,
                category="architecture",
                summary="Vaswani et al.",
                x=1200,
                y=460
            )
        ],
        edges=[],
        messages=[
            Message(
                role="user",
                content="What is the Transformer?",
            ),
        ],
    )
