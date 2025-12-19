import { useTagMappingStore } from "../../store/TagMappingStore";
import TagRow from "./TagRow";

export default function HTMLTagList({ tags }) {
  const { setTagMapping } = useTagMappingStore();

  if (!tags.length) return <p>No tags found</p>;

  return (
    <>
      {tags.map(tag => (
        <TagRow
          key={tag}
          tag={tag}
          onChange={val => setTagMapping(tag, val)}
        />
      ))}
    </>
  );
}
