set softtabstop=4           " see multiple spaces as tabstops so <BS> does the right thing
set expandtab               " converts tabs to white space
set shiftwidth=4            " width for autoindents
set autoindent              " indent a new line the same amount as the line just typed
set number                  " add line numbers
set wildmode=longest,list   " get bash-like tab completions
filetype plugin indent on   " allow auto-indenting depending on file type
syntax on                   " syntax highlighting
set mouse=a                 " enable mouse click
set clipboard=unnamedplus   " using system clipboard
filetype plugin on
set cursorline              " highlight current cursorline
set ttyfast                 " Speed up scrolling in Vim
set rnu
set so=9999
set noshowmode
set termguicolors

hi CursorLine term=bold cterm=bold ctermbg=black

call plug#begin()
Plug 'kyazdani42/nvim-web-devicons' " optional, for file icons
Plug 'kyazdani42/nvim-tree.lua'
Plug 'ryanoasis/vim-devicons'
Plug 'folke/tokyonight.nvim', { 'branch': 'main' }
Plug 'honza/vim-snippets'
Plug 'itchyny/lightline.vim'
Plug 'sainnhe/sonokai'
Plug 'sheerun/vim-polyglot'
call plug#end()

let g:sonokai_style = 'maia'
let g:sonokai_enable_italic = 1
let g:sonokai_disable_italic_comment = 1

colorscheme sonokai

let g:lightline = { 'colorscheme': 'sonokai', }
let g:NERDTreeDirArrows = 0
lua require'nvim-tree'.setup()
