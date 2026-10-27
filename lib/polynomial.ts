type Polynomial = [constant: number, linear: number, quadratic: number];
// Bounded, non-executing parser for numbers and polynomials through degree two.
export function parsePolynomial(
  input: string,
  variable?: string,
): Polynomial | null {
  const normalizedInput = input
    .replace(/\s/g, '')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/²/g, '^2');
  if (
    !normalizedInput ||
    normalizedInput.length > 200 ||
    /[^0-9.a-z+*/()^\-]/.test(normalizedInput)
  )
    return null;
  const rawTokens =
    normalizedInput.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z+*/()^\-]/g) || [];
  if (rawTokens.join('') !== normalizedInput) return null;
  const tokens: string[] = [];
  rawTokens.forEach((token, index) => {
    const previousToken = rawTokens[index - 1];
    if (
      index &&
      (/^(?:\d|\.)/.test(previousToken) ||
        previousToken === ')' ||
        previousToken === variable) &&
      (token === '(' || token === variable)
    )
      tokens.push('*');
    tokens.push(token);
  });
  let tokenIndex = 0;
  const validatePolynomial = (polynomial: Polynomial): Polynomial => {
    if (
      polynomial.some(
        (coefficient) =>
          !Number.isFinite(coefficient) || Math.abs(coefficient) > 1e15,
      )
    )
      throw new Error('INVALID_EXPRESSION');
    return polynomial;
  };
  const addPolynomials = (
    left: Polynomial,
    right: Polynomial,
    sign = 1,
  ): Polynomial =>
    validatePolynomial([
      left[0] + sign * right[0],
      left[1] + sign * right[1],
      left[2] + sign * right[2],
    ]);
  const multiplyPolynomials = (
    left: Polynomial,
    right: Polynomial,
  ): Polynomial => {
    const coefficients = [0, 0, 0, 0, 0];
    for (let leftDegree = 0; leftDegree < 3; leftDegree++)
      for (let rightDegree = 0; rightDegree < 3; rightDegree++)
        coefficients[leftDegree + rightDegree] +=
          left[leftDegree] * right[rightDegree];
    if (Math.abs(coefficients[3]) + Math.abs(coefficients[4]) > 1e-10)
      throw new Error('INVALID_EXPRESSION');
    return validatePolynomial(coefficients.slice(0, 3) as Polynomial);
  };
  const parsePrimary = (): Polynomial => {
    const token = tokens[tokenIndex++];
    if (token === '(') {
      const expression = parseSum();
      if (tokens[tokenIndex++] !== ')') throw new Error('INVALID_EXPRESSION');
      return expression;
    }
    if (variable && token === variable) return [0, 1, 0];
    if (!token || !/^(?:\d|\.)/.test(token))
      throw new Error('INVALID_EXPRESSION');
    return validatePolynomial([Number(token), 0, 0]);
  };
  const parsePower = (): Polynomial => {
    const base = parsePrimary();
    if (tokens[tokenIndex] !== '^') return base;
    tokenIndex++;
    const exponent = parseUnary();
    if (
      exponent[1] ||
      exponent[2] ||
      !Number.isInteger(exponent[0]) ||
      Math.abs(exponent[0]) > 10
    )
      throw new Error('INVALID_EXPRESSION');
    if (base[1] === 0 && base[2] === 0) {
      if (base[0] === 0 && exponent[0] <= 0)
        throw new Error('INVALID_EXPRESSION');
      return validatePolynomial([base[0] ** exponent[0], 0, 0]);
    }
    if (exponent[0] === 1) return base;
    if (exponent[0] === 2) return multiplyPolynomials(base, base);
    if (exponent[0] === 0) return [1, 0, 0];
    throw new Error('INVALID_EXPRESSION');
  };
  const parseUnary = (): Polynomial => {
    if (tokens[tokenIndex] === '-') {
      tokenIndex++;
      return validatePolynomial(
        parseUnary().map((coefficient) => -coefficient) as Polynomial,
      );
    }
    if (tokens[tokenIndex] === '+') {
      tokenIndex++;
      return parseUnary();
    }
    return parsePower();
  };
  const parseProduct = (): Polynomial => {
    let product = parseUnary();
    while (tokens[tokenIndex] === '*' || tokens[tokenIndex] === '/') {
      const operator = tokens[tokenIndex++];
      const right = parseUnary();
      if (operator === '*') product = multiplyPolynomials(product, right);
      else {
        if (right[1] || right[2] || right[0] === 0)
          throw new Error('INVALID_EXPRESSION');
        product = validatePolynomial(
          product.map((coefficient) => coefficient / right[0]) as Polynomial,
        );
      }
    }
    return product;
  };
  const parseSum = (): Polynomial => {
    let sum = parseProduct();
    while (tokens[tokenIndex] === '+' || tokens[tokenIndex] === '-') {
      const operator = tokens[tokenIndex++];
      sum = addPolynomials(sum, parseProduct(), operator === '+' ? 1 : -1);
    }
    return sum;
  };
  try {
    const value = parseSum();
    return tokenIndex === tokens.length ? value : null;
  } catch {
    return null;
  }
}
