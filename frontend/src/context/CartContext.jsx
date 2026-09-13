import { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// A simple in-memory cart. On checkout it is converted into an order via the API.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { productId, name, price, quantity, availableStock }

  function add(product, qty = 1) {
    setItems((cur) => {
      const found = cur.find((i) => i.productId === product.id);
      if (found) {
        return cur.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.availableStock) }
            : i
        );
      }
      return [
        ...cur,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: qty,
          availableStock: product.availableStock,
        },
      ];
    });
  }

  function setQty(productId, quantity) {
    setItems((cur) =>
      cur.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.availableStock)) }
          : i
      )
    );
  }

  const remove = (productId) => setItems((cur) => cur.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}
