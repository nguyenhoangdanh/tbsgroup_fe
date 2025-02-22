import { FormBlocksType } from '@/@types/form-block.type';
import { RowLayoutBlock } from '../components/blocks/layouts/RowLayout';
import { RadioSelectBlock } from '@/components/blocks/RadioSelectBlock';
import { TextFieldBlock } from '@/components/blocks/TextField';
import { TextAreaBlock } from '@/components/blocks/TextAreaBlock';
import { HeadingBlock } from '@/components/blocks/HeadingBlock';
import { ParagraphBlock } from '@/components/blocks/ParagraphBlock';
import { StarRatingBlock } from '@/components/blocks/StarRatingBlock';
import { SingleSelectBlock } from '@/components/blocks/SingleSelectBlock';



export const FormBlocks: FormBlocksType = {
   RowLayout: RowLayoutBlock, 
   RadioSelect: RadioSelectBlock,
   TextField: TextFieldBlock,
   TextArea: TextAreaBlock,
   Heading: HeadingBlock,
   Paragraph: ParagraphBlock,
   StarRating: StarRatingBlock,
   SingleSelect: SingleSelectBlock,
}