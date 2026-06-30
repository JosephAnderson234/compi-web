.data
print_fmt: .string "%ld\n"
println_fmt: .string "\n"

.text
.globl main

.globl fact
fact:
  pushq %rbp
  movq %rsp, %rbp
  subq $16, %rsp
  movl %edi, -16(%rbp)
  movslq -16(%rbp), %rax
  pushq %rax
  movq $1, %rax
  movq %rax, %rcx
  popq %rax
  cmpl %ecx, %eax
  movq $0, %rax
  setle %al
  movzbq %al, %rax
  cmpq $0, %rax
  je else_0
  movq $1, %rax
  jmp .end_fact
  jmp endif_0
else_0:
  movslq -16(%rbp), %rax
  pushq %rax
  movslq -16(%rbp), %rax
  pushq %rax
  movq $1, %rax
  movq %rax, %rcx
  popq %rax
  subl %ecx, %eax
  movq %rax, %rdi
  call fact
  movq %rax, %rcx
  popq %rax
  imull %ecx, %eax
  jmp .end_fact
endif_0:
.end_fact:
  leave
  ret

.globl main
main:
  pushq %rbp
  movq %rsp, %rbp
  movq $5, %rax
  movq %rax, %rdi
  call fact
  movq %rax, %rsi
  leaq print_fmt(%rip), %rdi
  movq $0, %rax
  call printf@PLT
  movq $0, %rax
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
