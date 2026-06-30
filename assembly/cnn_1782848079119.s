.data
print_fmt: .string "%ld\n"
println_fmt: .string "\n"

.text
.globl main

.globl main
main:
  pushq %rbp
  movq %rsp, %rbp
  subq $16, %rsp
  movq $2, %rax
  movl %eax, -16(%rbp)
  movslq -16(%rbp), %rax
  movq %rax, %r10
  movq $1, %rax
  cmpq %rax, %r10
  je case_0_0
  movq $2, %rax
  cmpq %rax, %r10
  je case_0_1
  jmp default_0
case_0_0:
  movq $10, %rax
  movq %rax, %rsi
  leaq print_fmt(%rip), %rdi
  movq $0, %rax
  call printf@PLT
  movq $0, %rax
case_0_1:
  movq $20, %rax
  movq %rax, %rsi
  leaq print_fmt(%rip), %rdi
  movq $0, %rax
  call printf@PLT
  movq $0, %rax
default_0:
  movq $30, %rax
  movq %rax, %rsi
  leaq print_fmt(%rip), %rdi
  movq $0, %rax
  call printf@PLT
  movq $0, %rax
endswitch_0:
  movq $0, %rax
  jmp .end_main
.end_main:
  leave
  ret

potencia:
  pushq %rbp
  movq %rsp, %rbp
  cmpq $0, %rsi
  jne .pot_nz
  movq $1, %rax
  jmp .pot_end
.pot_nz:
  cmpq $1, %rsi
  jne .pot_rec
  movq %rdi, %rax
  jmp .pot_end
.pot_rec:
  pushq %rbx
  movq %rdi, %rbx
  testq $1, %rsi
  jz .pot_even
  imulq %rdi, %rdi
  sarq $1, %rsi
  call potencia
  imulq %rbx, %rax
  popq %rbx
  jmp .pot_end
.pot_even:
  imulq %rdi, %rdi
  sarq $1, %rsi
  call potencia
  popq %rbx
.pot_end:
  leave
  ret

.section .note.GNU-stack,"",@progbits
