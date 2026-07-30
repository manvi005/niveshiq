from sqlalchemy import Column, String, Float, Date, Integer, BigInteger, UniqueConstraint, Index
from .db import Base


class Stock(Base):
    __tablename__ = "stocks"
    symbol = Column(String, primary_key=True)          # e.g. RELIANCE
    yahoo = Column(String, nullable=False)             # e.g. RELIANCE.NS
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    kind = Column(String, default="stock")             # "stock" | "index"


class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger)

    __table_args__ = (
        UniqueConstraint("symbol", "date", name="uq_symbol_date"),
        Index("ix_symbol_date", "symbol", "date"),
    )
