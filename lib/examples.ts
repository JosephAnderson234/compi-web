import { Example } from './types';

export const EXAMPLES: Example[] = [
  {
    name: 'Hola Mundo',
    code: `int main() {
  printf(42);
  return 0;
}`,
  },
  {
    name: 'Suma',
    code: `int main() {
  int a = 5;
  int b = 3;
  printf(a + b);
  return 0;
}`,
  },
  {
    name: 'Factorial',
    code: `int fact(int n) {
  if (n <= 1) {
    return 1;
  } else {
    return n * fact(n - 1);
  }
}

int main() {
  printf(fact(5));
  return 0;
}`,
  },
  {
    name: 'Switch',
    code: `int main() {
  int x = 2;
  switch (x) {
    case 1: { printf(10); }
    case 2: { printf(20); }
    default: { printf(30); }
  }
    return 0;
}`,
  },
  {
    name: 'Punteros',
    code: `int main() {
  int x = 42;
  int* p = &x;
  printf(*p);
  return 0;
}`,
  },
  {
    name: 'Struct',
    code: `struct Punto {
  int x;
  int y;
};

int main() {
  struct Punto pt;
  pt.x = 10;
  pt.y = 20;
  printf(pt.x + pt.y);
  return 0;
}`,
  },
  {
    name: 'Arreglos',
    code: `int main() {
  int arr[3];
  arr[0] = 1;
  arr[1] = 2;
  arr[2] = 3;
  printf(arr[0] + arr[1] + arr[2]);
  return 0;
}`,
  },
  {
    name: 'Long Long',
    code: `int main() {
  long long big = 100000;
  printf(big);
  return 0;
}`,
  },
  {
    name: 'Malloc',
    code: `int main() {
  int* p = malloc(4);
  *p = 99;
  printf(*p);
  free(p);
  return 0;
}`,
  },
  {
    name: 'Unsigned',
    code: `int main() {
  unsigned u = 42;
  printf(u);
  return 0;
}`,
  },
  {
    name: 'While loop',
    code: `int main() {
  int i = 0;
  while (i < 5) {
    printf(i);
    i = i + 1;
  }
    return 0;
}`,
  },
  {
    name: 'For loop',
    code: `int main() {
  for (int i = 0; i < 3; i = i + 1) {
    printf(i);
  }
    return 0;
}`,
  },
];
